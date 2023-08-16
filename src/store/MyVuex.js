let Vue = null

class Store {
  constructor (options) {
    this._getter = options.getter || {}
    this._mutations = options.mutations || {}
    this._actions = options.actions || {}

    // 绑定 this 的上下文，因为当在 actions 中结构出来以后，commit 的 this 上下文就变了
    this.commit = this.commit.bind(this)

    /*
      getter 可以被视作是计算属性，所以实现方式采用 vue 计算属性方式实现
    */
    const computed = {}
    this.getters = {}
    const store = this
    Object.keys(this._getter).forEach((key) => {
      const fn = this._getter[key]
      computed[key] = function () {
        // 此处是的 state 是 vm 中的 data，所以当参数变动，传入的 computed 也会变动
        return fn(store.state)
      }
      // 将 getters 中的值挂载到 Store 上，外部可以使用 $store.getters 获取参数值
      Object.defineProperty(store.getters, key, {
        get: () => store.vm[key]
      })
    })

    // 用 Vue 的双向绑定的特性定义 state
    this.vm = new Vue({
      data: {
        state: options.state || {}
      },
      computed
    })
  }

  get state () {
    return this.vm.state
  }

  commit (method, arg) {
    const fn = this._mutations[method]
    if (!fn) {
      return
    }
    fn(this.state, arg)
  }

  dispatch (method, arg) {
    const fn = this._actions[method]
    if (!fn) {
      return
    }
    fn(this, arg)
  }
}

const install = function (vue) {
  Vue = vue

  // 混合到 Vue 的初始 options 中，将应用到每个 Vue 组件上
  Vue.mixin({
    /*
      父beforeCreate-> 父created -> 父beforeMounted -> 子beforeCreate ->子created ->子beforeMount ->子 mounted -> 父mounted
      子组件 beforeCreate 的时候，父组件已经 beforeCreate 了，所以可以拿到 router 实例
    */
    beforeCreate () {
      /*
        this.$options.store 在最开始的时候只有根组件有，需要将 store 对象挂在到根组件上，这样子组件就能访问了
        所有的子组件都去获取父组件的实例，并绑定到自己的实例上，这样 store 属性就层层向下传递了
        并且每个组件都是共享的 store 实例，保证了唯一性
      */
      if (this.$options && this.$options.store) {
        this.$store = this.$options.store
      } else {
        this.$store = this.$parent && this.$parent.$store
      }
    }
  })
}

export default {
  Store,
  install
}
