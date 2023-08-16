function defineReactive (obj, key, val) {
  Object.defineProperty(obj, key, {
    get () {
      console.log(`get ${key}: ${val}`)
      return val
    },
    set (newVal) {
      if (newVal !== val) {
        val = newVal
        // update()
      }
    }
  })
}

function observe (obj) {
  if (typeof obj !== 'object' || obj == null) {
    return
  }
  Object.keys(obj).forEach(key => {
    defineReactive(obj, key, obj[key])
    observe(obj[key])
  })
}

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
    this.$options = options
    this.$data = options.data

    observe(this.$data)
    proxy(this)
  }
}
