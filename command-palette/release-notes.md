# Fixes

- Custom JavaScript commands now require confirmation. This protects against attacks where someone changes the file to execute malicious code. New commands created through Settings are automatically trusted, but if they are changed externally you will get the confirmation.

> [!WARNING]
> If you have custom JS commands from before this update, they'll ask for confirmation before execution.

# Contributors

Thanks to @anupamme for contributing, this release is most of their work
