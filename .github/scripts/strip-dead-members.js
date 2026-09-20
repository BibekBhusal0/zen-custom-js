// Removes unreferenced members from top-level objects/classes in a bundle
// (Bun only shakes top-level exports). Bails to input on any uncertainty.

import * as acorn from "acorn";

function parse(code) {
  try {
    return acorn.parse(code, { ecmaVersion: "latest", sourceType: "module", ranges: true });
  } catch {
    try {
      return acorn.parse(code, { ecmaVersion: "latest", sourceType: "script", ranges: true });
    } catch {
      return null;
    }
  }
}

function memberKey(node) {
  if (node.computed) {
    if (
      node.key.type === "Literal" &&
      (typeof node.key.value === "string" || typeof node.key.value === "number")
    )
      return String(node.key.value);
    return null;
  }
  if (node.key.type === "Identifier") return node.key.name;
  if (node.key.type === "Literal") return String(node.key.value);
  return null;
}

function collectIds(node, set) {
  if (!node) return;
  if (node.type === "Identifier") set.add(node.name);
  else if (node.type === "ArrayPattern") node.elements.forEach((e) => collectIds(e, set));
  else if (node.type === "ObjectPattern")
    node.properties.forEach((p) =>
      p.type === "RestElement" ? collectIds(p.argument, set) : collectIds(p.value, set)
    );
  else if (node.type === "RestElement") collectIds(node.argument, set);
  else if (node.type === "AssignmentPattern") collectIds(node.left, set);
}

export function stripDeadMembers(code) {
  try {
    return stripInner(code);
  } catch (err) {
    console.warn(
      `strip-dead-members: analysis failed, keeping bundle as-is (${err?.message ?? err})`
    );
    return { code, stripped: 0 };
  }
}

function stripInner(code) {
  const ast = parse(code);
  if (!ast) return { code, stripped: 0 };

  const unwrap = (s) =>
    (s.type === "ExportNamedDeclaration" || s.type === "ExportDefaultDeclaration") && s.declaration
      ? s.declaration
      : s;

  // Bun wraps IIFE bundles in `(() => { ... })()`; analyze the wrapper body.
  let topBody = ast.body;
  let aliasDepth = 1;
  for (let i = 0; i < 3; i++) {
    if (topBody.length !== 1 || topBody[0].type !== "ExpressionStatement") break;
    const expr = topBody[0].expression;
    if (expr?.type !== "CallExpression") break;
    const fn = expr.callee;
    if (
      (fn?.type === "FunctionExpression" || fn?.type === "ArrowFunctionExpression") &&
      fn.body?.type === "BlockStatement" &&
      (fn.params?.length ?? 0) === 0
    ) {
      topBody = fn.body.body;
      aliasDepth++;
    } else break;
  }

  const containers = new Map(); // name -> {kind, members:[{key,node,isInstance,isCtor}], bailed}
  const extendsMap = new Map();

  for (let stmt of topBody) {
    stmt = unwrap(stmt);
    if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id.type !== "Identifier" || !d.init || d.init.type !== "ObjectExpression") continue;
        if (containers.has(d.id.name)) {
          containers.get(d.id.name).bailed = true;
          continue;
        }
        const members = [];
        let bad = false;
        for (const prop of d.init.properties) {
          if (prop.type !== "Property") {
            bad = true;
            break;
          }
          const k = memberKey(prop);
          if (k === null || k === "__proto__") {
            bad = true;
            break;
          }
          members.push({ key: k, node: prop, isInstance: false, isCtor: false });
        }
        containers.set(d.id.name, { kind: "object", members, bailed: bad });
      }
    } else if (stmt.type === "ClassDeclaration" && stmt.id?.type === "Identifier") {
      if (containers.has(stmt.id.name)) {
        containers.get(stmt.id.name).bailed = true;
        continue;
      }
      const members = [];
      let bad = false;
      for (const el of stmt.body.body) {
        if (el.type === "StaticBlock") {
          bad = true;
          break;
        }
        if (el.type !== "MethodDefinition") continue;
        if (el.decorators?.length) {
          bad = true;
          break;
        }
        const k = memberKey(el);
        if (k === null) {
          bad = true;
          break;
        }
        members.push({
          key: k,
          node: el,
          isInstance: !el.static,
          isCtor: el.kind === "constructor",
        });
      }
      containers.set(stmt.id.name, { kind: "class", members, bailed: bad });
      if (stmt.superClass?.type === "Identifier")
        extendsMap.set(stmt.id.name, stmt.superClass.name);
    } else if (
      (stmt.type === "FunctionDeclaration" || stmt.type === "VariableDeclaration") &&
      stmt.id?.type === "Identifier" &&
      containers.has(stmt.id.name)
    ) {
      containers.get(stmt.id.name).bailed = true;
    }
  }
  if (containers.size === 0) return { code, stripped: 0 };

  const refs = new Map();
  const instanceRefs = new Map();
  const aliases = new Map(); // local -> className
  const aliasBailed = new Set();
  for (const name of containers.keys()) {
    refs.set(name, new Set());
    instanceRefs.set(name, new Set());
  }
  let globalBail = false;

  const bailTree = (name) => {
    let cur = name;
    const seen = new Set();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (!containers.has(cur)) break; // base class outside the bundle scope: nothing to keep
      containers.get(cur).bailed = true;
      cur = extendsMap.get(cur);
    }
  };
  // Refs on a subclass also protect ancestors (static inheritance).
  const addRef = (name, key) => {
    let cur = name;
    const seen = new Set();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (refs.has(cur)) {
        refs.get(cur).add(key);
        instanceRefs.get(cur).add(key);
      }
      cur = extendsMap.get(cur);
    }
  };
  const bailInstance = (name) => {
    const c = containers.get(name);
    if (!c) return;
    for (const m of c.members) if (m.isInstance) instanceRefs.get(name).add(m.key);
    instanceRefs.get(name).add("constructor");
  };

  const topNames = new Set();
  for (let stmt of topBody) {
    stmt = unwrap(stmt);
    if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        collectIds(d.id, topNames);
        if (
          d.id.type === "Identifier" &&
          d.init?.type === "NewExpression" &&
          d.init.callee.type === "Identifier" &&
          containers.has(d.init.callee.name)
        ) {
          aliases.set(d.id.name, d.init.callee.name);
        }
      }
    } else if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id)
      topNames.add(stmt.id.name);
  }
  const scopes = [topNames];
  // Innermost enclosing container for `this` attribution (over-keeping on ambiguity is safe).
  const ownerStack = [];
  const isTracked = (n) => containers.has(n);
  const shadowed = (n) => {
    for (let i = 1; i < scopes.length; i++) if (scopes[i].has(n)) return true;
    return false;
  };
  // Aliases (`const x = new C()`) are only tracked at top level.
  const aliasVisible = (n) => {
    if (!aliases.has(n)) return false;
    for (let i = 1; i < scopes.length; i++) if (scopes[i].has(n)) return false;
    return true;
  };
  const useName = (n) => isTracked(n) && !shadowed(n);

  function visit(node, parent) {
    if (!node || typeof node.type !== "string") return;

    switch (node.type) {
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression": {
        scopes.push(new Set());
        if (node.type === "FunctionExpression" && node.id)
          scopes[scopes.length - 1].add(node.id.name);
        for (const p of node.params) collectIds(p, scopes[scopes.length - 1]);
        if (node.body) visit(node.body, node);
        scopes.pop();
        return;
      }
      case "BlockStatement":
        if (!(
          parent &&
          (parent.type === "FunctionDeclaration" ||
            parent.type === "FunctionExpression" ||
            parent.type === "ArrowFunctionExpression")
        )) {
          scopes.push(new Set());
          for (const s of node.body) visit(s, node);
          scopes.pop();
          return;
        }
        break;
      case "CatchClause":
        scopes.push(new Set());
        collectIds(node.param, scopes[scopes.length - 1]);
        visit(node.body, node);
        scopes.pop();
        return;
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
        scopes.push(new Set());
        for (const k of Object.keys(node)) {
          const v = node[k];
          if (Array.isArray(v)) {
            for (const c of v) if (c?.type) visit(c, node);
          } else if (v?.type) {
            visit(v, node);
          }
        }
        scopes.pop();
        return;
      case "VariableDeclaration":
        for (const d of node.declarations) {
          // topBody names are pre-scanned; re-adding them deeper would self-shadow.
          if (scopes.length !== aliasDepth) collectIds(d.id, scopes[scopes.length - 1]);
          if (
            scopes.length === aliasDepth &&
            d.init?.type === "NewExpression" &&
            d.init.callee.type === "Identifier" &&
            useName(d.init.callee.name) &&
            d.id.type === "Identifier"
          ) {
            aliases.set(d.id.name, d.init.callee.name);
          }
          if (d.init?.type === "Identifier" && useName(d.init.name) && d.init.name !== d.id.name)
            bailTree(d.init.name);
          const isObjInit =
            d.id.type === "Identifier" &&
            containers.get(d.id.name)?.kind === "object" &&
            d.init?.type === "ObjectExpression";
          if (d.init) {
            if (isObjInit) {
              ownerStack.push({ kind: "object", name: d.id.name });
              visit(d.init, d);
              ownerStack.pop();
            } else {
              visit(d.init, d);
            }
          }
        }
        return;
      case "ClassDeclaration":
      case "ClassExpression":
        ownerStack.push({
          kind: "class",
          name: node.id?.type === "Identifier" ? node.id.name : null,
        });
        if (node.superClass) visit(node.superClass, node);
        visit(node.body, node);
        ownerStack.pop();
        return;
      case "WithStatement":
        if (node.object.type === "Identifier" && useName(node.object.name))
          bailTree(node.object.name);
        visit(node.object, node);
        visit(node.body, node);
        return;
    }

    if (node.type === "MemberExpression") {
      const obj = node.object;
      if (
        obj.type === "Identifier" &&
        !shadowed(obj.name) &&
        aliasVisible(obj.name) &&
        !aliasBailed.has(obj.name)
      ) {
        if (node.computed) {
          if (
            node.property.type === "Literal" &&
            (typeof node.property.value === "string" || typeof node.property.value === "number")
          ) {
            recordInstanceRef(obj.name, String(node.property.value));
          } else bailInstance(aliases.get(obj.name));
        } else if (node.property.type === "Identifier") {
          recordInstanceRef(obj.name, node.property.name);
        } else bailInstance(aliases.get(obj.name));
      } else if (obj.type === "Identifier" && useName(obj.name)) {
        if (node.computed) {
          if (
            node.property.type === "Literal" &&
            (typeof node.property.value === "string" || typeof node.property.value === "number")
          ) {
            if (aliases.has(obj.name) && !aliasBailed.has(obj.name))
              recordInstanceRef(obj.name, String(node.property.value));
            else addRef(obj.name, String(node.property.value));
          } else bailTree(obj.name);
        } else if (node.property.type === "Identifier") {
          if (aliases.has(obj.name) && !aliasBailed.has(obj.name))
            recordInstanceRef(obj.name, node.property.name);
          else addRef(obj.name, node.property.name);
        } else bailTree(obj.name);
      }
      introspectionCall(node, parent);
    } else if (node.type === "CallExpression") {
      const c = node.callee;
      if (
        c.type === "Identifier" &&
        (c.name === "eval" || c.name === "Function") &&
        !shadowed(c.name)
      ) {
        globalBail = true;
        return;
      }
    } else if (node.type === "NewExpression") {
      if (node.callee.type === "Identifier" && useName(node.callee.name)) {
        const c = containers.get(node.callee.name);
        if (c.kind !== "class") bailTree(node.callee.name);
        else {
          const aliased =
            parent?.type === "VariableDeclarator" &&
            parent.init === node &&
            parent.id.type === "Identifier";
          if (!aliased) bailInstance(node.callee.name); // instance escapes or untracked: keep all instance
        }
      }
    } else if (node.type === "SpreadElement") {
      const a = node.argument;
      if (a.type === "Identifier" && useName(a.name)) bailTree(a.name);
    } else if (node.type === "AssignmentExpression") {
      if (node.left.type === "Identifier") {
        if (useName(node.left.name)) bailTree(node.left.name);
        if (aliasVisible(node.left.name)) aliasBailed.add(node.left.name);
      }
    } else if (node.type === "ForInStatement") {
      const r = node.right;
      if (r.type === "Identifier" && useName(r.name)) bailTree(r.name);
    } else if (node.type === "ThisExpression") {
      const owner = ownerStack.length ? ownerStack[ownerStack.length - 1] : null;
      const ownerName = owner && owner.name && isTracked(owner.name) ? owner.name : null;
      if (
        parent?.type === "MemberExpression" &&
        parent.object === node &&
        ((!parent.computed && parent.property.type === "Identifier") ||
          (parent.computed &&
            parent.property.type === "Literal" &&
            (typeof parent.property.value === "string" ||
              typeof parent.property.value === "number")))
      ) {
        const key = !parent.computed ? parent.property.name : String(parent.property.value);
        if (ownerName) addRef(ownerName, key);
      } else if (ownerName) {
        // Bare `this` may leak the container.
        if (owner.kind === "class") bailInstance(ownerName);
        else bailTree(ownerName);
      }
    } else if (node.type === "Super") {
      const owner = ownerStack.length ? ownerStack[ownerStack.length - 1] : null;
      const cls = owner && owner.kind === "class" ? owner.name : null;
      const base = cls ? extendsMap.get(cls) : null;
      if (base && isTracked(base)) {
        if (
          parent?.type === "MemberExpression" &&
          !parent.computed &&
          parent.property.type === "Identifier"
        )
          addRef(base, parent.property.name);
        else bailTree(base);
      }
    } else if (node.type === "Identifier") {
      if (useName(node.name) && parent && !allowedBare(node, parent)) bailTree(node.name);
      if (aliasVisible(node.name) && parent && !allowedAlias(node, parent))
        aliasBailed.add(node.name);
    }

    for (const k of Object.keys(node)) {
      if (k === "parent") continue;
      const v = node[k];
      if (Array.isArray(v)) {
        for (const c of v) if (c && typeof c.type === "string") visit(c, node);
      } else if (v && typeof v.type === "string") {
        visit(v, node);
      }
    }
  }

  function recordInstanceRef(alias, key) {
    const cls = aliases.get(alias);
    let cur = cls;
    const seen = new Set();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      instanceRefs.get(cur)?.add(key);
      refs.get(cur)?.add(key);
      cur = extendsMap.get(cur);
    }
  }

  function allowedBare(node, parent) {
    if (parent.type === "MemberExpression" && parent.object === node) return true;
    if (
      (parent.type === "NewExpression" || parent.type === "CallExpression") &&
      parent.callee === node
    )
      return true;
    if (
      (parent.type === "ClassDeclaration" || parent.type === "ClassExpression") &&
      (parent.superClass === node || parent.id === node)
    )
      return true;
    if (
      (parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") &&
      parent.id === node
    )
      return true;
    if (parent.type === "VariableDeclarator" && parent.id === node) return true;
    if (parent.type === "Property" && parent.key === node && !parent.computed) return true;
    if (parent.type === "MemberExpression" && parent.property === node && !parent.computed)
      return true;
    if (
      (parent.type === "LabeledStatement" ||
        parent.type === "BreakStatement" ||
        parent.type === "ContinueStatement") &&
      parent.label === node
    )
      return true;
    if (parent.type === "MethodDefinition" && parent.key === node && !parent.computed) return true;
    if (parent.type === "PropertyDefinition" && parent.key === node && !parent.computed)
      return true;
    return false; // everything else (args, returns, templates, operators...) -> bail
  }

  function allowedAlias(node, parent) {
    return parent.type === "MemberExpression" && parent.object === node;
  }

  function introspectionCall(node, parent) {
    if (node.computed || node.property.type !== "Identifier") return;
    const m = node.property.name;
    const obj = node.object;
    const isObj =
      obj.type === "Identifier" &&
      obj.name === "Object" &&
      [
        "keys",
        "values",
        "entries",
        "getOwnPropertyNames",
        "getOwnPropertyDescriptors",
        "assign",
        "freeze",
        "seal",
        "defineProperties",
        "create",
      ].includes(m);
    const isJson = obj.type === "Identifier" && obj.name === "JSON" && m === "stringify";
    if ((isObj || isJson) && parent?.type === "CallExpression" && parent.callee === node) {
      for (const a of parent.arguments) {
        const t = a.type === "SpreadElement" ? a.argument : a;
        if (t?.type === "Identifier" && useName(t.name)) bailTree(t.name);
      }
    }
  }

  visit(ast, null);
  if (globalBail) return { code, stripped: 0 };

  const removals = [];
  for (const [name, c] of containers) {
    if (c.bailed) continue;
    if (c.kind === "object") {
      const keep = refs.get(name);
      for (const m of c.members) if (!keep.has(m.key)) removals.push(m.node.range);
    } else {
      const keepS = refs.get(name);
      const keepI = instanceRefs.get(name);
      const hasAlias = [...aliases.values()].includes(name);
      const aliasOk =
        hasAlias && ![...aliases.keys()].some((a) => aliases.get(a) === name && aliasBailed.has(a));
      for (const m of c.members) {
        if (m.isCtor) continue;
        if (m.isInstance) {
          if (keepS.has("prototype")) continue;
          if (!hasAlias || !aliasOk) continue;
          if (keepI.has(m.key)) continue;
          removals.push(m.node.range);
        } else {
          if (keepS.has(m.key)) continue;
          removals.push(m.node.range);
        }
      }
    }
  }
  if (removals.length === 0) return { code, stripped: 0 };

  removals.sort((a, b) => b[0] - a[0]);
  let out = code;
  for (const [s, e] of removals) {
    let rs = s,
      re = e;
    const mAfter = out.slice(re).match(/^(\s*,)/);
    if (mAfter) {
      re += mAfter[0].length;
      re += out.slice(re).match(/^\s*/)[0].length;
    } else {
      const mBefore = out.slice(0, rs).match(/,(\s*)$/);
      if (mBefore) rs -= mBefore[0].length;
      else {
        const mNl = out.slice(re).match(/^\s*\n?/);
        if (mNl) re += mNl[0].length;
      }
    }
    out = out.slice(0, rs) + out.slice(re);
  }

  if (!parse(out)) return { code, stripped: 0 };
  return { code: out, stripped: removals.length };
}

// Standalone usage: bun strip-dead-members.js <bundle.js> [...] (also runs via build.js).
if (import.meta.main) {
  for (const file of Bun.argv.slice(2)) {
    const original = await Bun.file(file).text();
    const { code, stripped } = stripDeadMembers(original);
    if (stripped > 0) {
      await Bun.write(file, code);
      console.log(
        `Stripped ${stripped} dead member(s) from ${file} (${original.length} -> ${code.length} bytes)`
      );
    } else {
      console.log(`No dead members in ${file}`);
    }
  }
}
