module.exports = class LogPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('Log', (compilation) => {
      // 打印所有的编译入口
      compilation.hooks.addEntry.tap('addEntryLog', (entry, name) => {
        // eslint-disable-next-line
        console.log('addEntry ==========> ', name, entry);
      });
    });
  }
};