let Vue = null

/** 将数组格式的路由转换为对象类型的，{path: {}} */
function createMap (routes) {
  return routes.reduce((pre, current) => {
    pre[current.path] = current.component
    return pre
  }, {})
}

class MyRouter {
  constructor (options) {
    this.mode = options.mode || 'hash'
    this.routes = options.routes || [] // 路由数组表
    this.routesMap = createMap(this.routes) // 转换路由的数据结构

    // 定义一个响应式的属性保存路径，变更路径就会触发 router-link 和 router-view 的重新渲染
    Vue.util.defineReactive(this, 'currentPath', null)

    this.registerLoadEvent()
  }

  /** 注册 load 事件 */
  registerLoadEvent () {
    if (this.mode === 'hash') {
      // 先判断用户打开时有没有 hash 值，没有的话跳转到 #/
      if (!location.hash) {
        location.hash = '/'
      }
      window.addEventListener('load', () => {
        this.currentPath = location.hash.slice(1)
      })
      window.addEventListener('hashchange', () => {
        this.currentPath = location.hash.slice(1)
      })
    } else {
      // 判断有没有路径，没有跳转到 /
      if (!location.pathname) {
        location.pathname = '/'
      }
      window.addEventListener('load', () => {
        this.currentPath = location.pathname
      })
      window.addEventListener('popstate', () => {
        this.currentPath = location.pathname
      })
    }
  }
}

/**
 * 注册组件
 * @param {*} vue vue 实例
 */
MyRouter.install = function (vue) {
  // 将 vue 保存到全局后续需要使用
  Vue = vue

  // 混合到 Vue 的初始 options 中，将应用到每个 Vue 组件上
  Vue.mixin({
    /*
      父beforeCreate-> 父created -> 父beforeMounted -> 子beforeCreate ->子created ->子beforeMount ->子 mounted -> 父mounted
      子组件 beforeCreate 的时候，父组件已经 beforeCreate 了，所以可以拿到 router 实例
    */
    beforeCreate () {
      /*
        this.$options.router 在最开始的时候只有根组件有，需要将 router 对象挂在到根组件上，这样子组件就能访问了
        所有的子组件都去获取父组件的实例，并绑定到自己的实例上，这样 router 属性就层层向下传递了
        并且每个组件都是共享的 router 实例，保证了唯一性
      */
      if (this.$options && this.$options.router) {
        // this._root = this // 把当前实例挂载到根组件上
        this._router = this.$options.router // 把 router 属性挂在到根组件上
      } else {
        this._router = this.$parent && this.$parent._router // 获取父组件的 router 实例
      }

      // 在每个组件都生成一个 $router 属性
      Object.defineProperty(this, '$router', {
        get () {
          return this._root._router
        }
      })
    }
  })

  Vue.component('router-link', {
    props: {
      to: String
    },
    render (h) {
      const mode = this._self._router.mode
      const to = mode === 'hash' ? '#' + this.to : this.to
      return h('a', { attrs: { href: to } }, this.$slots.default)
    }
  })
  Vue.component('router-view', {
    render (h) {
      const current = this._self._router.currentPath
      const routeMap = this._self._router.routesMap
      return h(routeMap[current])
    }
  })
}

export default MyRouter
