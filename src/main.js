import "babel-polyfill";
import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';
import 'default-passive-events';
import * as _ from 'lodash';
import VueClipboard from 'vue-clipboard2';
import './assets/styles/style.less';

Vue.config.productionTip = false;
Vue.config.performance = true;

Vue.prototype._ = _;
Vue.use(ElementUI, { size: 'small' });
Vue.use(VueClipboard);

new Vue({
    render: h => h(App),
}).$mount('#app');
