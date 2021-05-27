@echo off
echo. && echo Checking if pkg is installed && echo.
call pkg -v
echo. && echo Installing all dependencies && echo.
call npm i
echo. && echo Fixing a dependency  && echo.

echo // modified >".\node_modules\lzma\index.js"
echo var lzma;>>".\node_modules\lzma\index.js"
echo function load_lzma(){return require("./src/lzma_worker.js").LZMA_WORKER;}>>".\node_modules\lzma\index.js"
echo lzma = load_lzma();>>".\node_modules\lzma\index.js"
echo module.exports.LZMA = function LZMA(){return lzma;}>>".\node_modules\lzma\index.js"
echo module.exports.compress   = lzma.compress;>>".\node_modules\lzma\index.js"
echo module.exports.decompress = lzma.decompress;>>".\node_modules\lzma\index.js"


echo. && echo Packaging the script && echo.
call pkg package.json
echo. && echo.
echo Complete