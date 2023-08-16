import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from './MyVuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    num: 0
  },
  getter: {
    getNum: (state) => {
      return state.num
    }
  },
  mutations: {
    addition (state, num) {
      state.num += num
    }
  },
  actions: {
    asyncAddition ({ commit }, arg) {
      setTimeout(() => {
        commit('addition', arg)
      }, 1000)
    }
  },
  modules: {
    // 模块化，可以将不同的对象合并
  }
})
