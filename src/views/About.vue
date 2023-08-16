<template>
  <div class="about">
    <h1>This is an about page</h1>
    <p>state: {{ this.$store.state.num }}</p>
    <p>getter: {{ this.$store.getters.getNum }}</p>
    <button @click="add">+1</button><br/><br/>
    <button @click="asyncAdd">异步+2</button>
  </div>
</template>
<script>
export default {
  name: 'about',
  methods: {
    add () {
      this.$store.commit('addition', 1)
    },
    asyncAdd () {
      this.$store.dispatch('asyncAddition', 2)
    }
  }
}
</script>
