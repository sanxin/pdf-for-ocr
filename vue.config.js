const path = require('path')

function resolve(dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    lintOnSave: false,
    productionSourceMap: false,
    chainWebpack(config) {
        config.resolve.alias
            .set('assets', resolve('src/assets'))
            .set('views', resolve('src/views'))
    },
    publicPath: './',
    css: {
        loaderOptions: {
            less: {
                globalVars: {
                    TextColor: '#364A63',
                    PaginationColor: "#8692A1",
                    TitleBlue: "#1B6BDE"
                }
            }
        }
    }
}

