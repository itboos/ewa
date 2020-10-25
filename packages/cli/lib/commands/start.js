'use strict';

const utils = require('../utils');

module.exports = async function start() {
  utils.ensureEwaProject();

  // utils.checkUpdates(); 暂时去掉更新

  utils.log('正在启动项目实时编译...');

  const runEwa = require.resolve('../../../webpack/lib/run.js');

  require(runEwa);
};
