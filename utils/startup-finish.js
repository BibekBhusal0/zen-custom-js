export function startupFinish(callback){
  if(typeof UC_API === "undefined") return
  UC_API.Runtime.startupFinished().then(() => callback())
}
