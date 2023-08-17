let DepTarget = null
/** 对象创建响应式参数 */
function defineReactive (obj, key, val) {
  // 嵌套对象也要响应式化
  observe(val)

  // * 创建 Dep 实例，一个 key 只有一个 Dep 实例，但是因为模板中可能多次使用，所以会创建多个 watcher 实例
  const dep = new Dep()

  Object.defineProperty(obj, key, {
    get () {
      /*
       * 在解析模板的时候会创建 watcher，在 watcher 中赋予一个全局变量一个临时值保存 watcher 的实例，
       * 然后手动取一下 key 的值，就会触发 getter，然后将 watcher 实例放入收集器中
      */
      DepTarget && dep.addDep(DepTarget)
      return val
    },
    set (newVal) {
      if (newVal !== val) {
        val = newVal
        // 新值如果是个对象，仍然需要地柜遍历处理
        observe(val)
        // * 通知 watcher 更新
        dep.notify()
      }
    }
  })
}

/** 对象响应化，遍历每个 key，定义 getter、setter */
function observe (obj) {
  if (typeof obj !== 'object' || obj == null) {
    return
  }
  // eslint-disable-next-line no-new
  new Observer(obj)
}

/** 主要像源码靠近，源码中是这么实现的 */
class Observer {
  constructor (obj) {
    if (Array.isArray(obj)) {
      // TODO
    } else {
      this.walk(obj)
    }
  }

  walk (obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key])
    })
  }
}

/** 将 data 上的属性代理到 this 上，这样只要通过 this.xxx 就能获取到参数值了 */
function proxy (vm) {
  Object.keys(vm.$data).forEach(key => {
    Object.defineProperty(vm, key, {
      get () {
        return vm.$data[key]
      },
      set (newVal) {
        vm.$data[key] = newVal
      }
    })
  })
}

// eslint-disable-next-line no-unused-vars
class MyVue {
  constructor (options) {
    // 保存属性
    this.$options = options
    this.$data = options.data

    // 对 data 做响应式处理
    observe(this.$data)

    // 代理
    proxy(this)

    // 编译 html
    // eslint-disable-next-line no-new
    new Compile(options.el, this)
  }
}

/** 解析 html，并建立 watcher，在 Vue 创建实例的时候，所以只执行了一次 */
class Compile {
  constructor (el, vm) {
    this.$vm = vm
    this.$el = document.querySelector(el)

    if (this.$el) {
      this.compile(this.$el)
    }
  }

  /** 遍历 node，判断节点类型，做不同的处理 */
  compile (el) {
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node => {
      if (this.isElement(node)) {
        // 解析指令
        this.compileElement(node)

        // 子元素递归
        if (node.childNodes && node.childNodes.length > 0) {
          this.compile(node)
        }
      } else if (this.isInterpolation(node)) {
        // 解析插值表达式 {{ xxxx }}
        this.compileText(node)
      }
    })
  }

  /** 解析元素中的指令，v- 开头，@ 开头 */
  compileElement (node) {
    const nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr => {
      const attrName = attr.name // k-text
      const exp = attr.value // xxx
      if (this.isDirective(attrName)) {
        const dir = attrName.substring(2)
        // 执行函数，例如 k-text
        this[dir] && this[dir](node, exp)
      }
    })
  }

  /** 判断是否元素节点 */
  isElement (node) {
    return node.nodeType === 1
  }

  /** 判断是否插值表达式 {{ xxxx }} */
  isInterpolation (node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  /** 判断是否指令 */
  isDirective (attr) {
    return attr.indexOf('v-') === 0
  }

  /** 编译插值文本 */
  compileText (node) {
    this.update(node, RegExp.$1, 'text')
  }

  /** v-text */
  text (node, exp) {
    this.update(node, exp, 'text')
  }

  /** v-html */
  html (node, exp) {
    this.update(node, exp, 'html')
  }

  /** 初始化的时候，解析 html 中的插值和指令，并且创建一个观察者，传一个更新方法 */
  update (node, exp, dir) {
    // 初始化
    const fn = this[dir + 'Updater']
    fn && fn(node, this.$vm[exp])

    // 更新
    // eslint-disable-next-line no-new
    new Watcher(this.$vm, exp, function (val) {
      fn && fn(node, val)
    })
  }

  textUpdater (node, val) {
    node.textContent = val
  }

  htmlUpdater (node, val) {
    node.innerHTML = val
  }
}

// 负责 dom 更新
class Watcher {
  constructor (vm, key, updater) {
    this.vm = vm
    this.key = key
    this.updater = updater

    // 触发一下值的 getter
    DepTarget = this
    const _temp = this.vm[this.key]
    DepTarget = null && _temp // 这里永远是 null
  }

  /** 将来会被 Dep 调用 */
  update () {
    this.updater.call(this.vm, this.vm[this.key])
  }
}

// 保存 watcher 实例的依赖类
class Dep {
  constructor () {
    this.deps = []
  }

  /**
   * 新增依赖关系
   * @param {*} dep watcher 实例
   */
  addDep (dep) {
    this.deps.push(dep)
  }

  /** 执行 watcher 中的更新 */
  notify () {
    this.deps.forEach((dep) => dep.update())
  }
}
