<template>
  <div>
    <pre>{{ log }}</pre>
  </div>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    log: "",
    loading: true,
    cancelSource: null
  }),
  props : {
    repos: {
      type: Array,
    },
    open: {
      type: Boolean
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    init: function() {
      this.loading = true,
    this.log = 'Please wait while syncing all git repos ...';
    this.executeCommand();
    },
    executeCommand: async function () {
      const repos = this.repos.map((r)=> (r.path));
      this.cancelSource = this.$axios.CancelToken.source();
      this.log = await this.$axios.$post(`/cmds/clean-checkout` , {repos}, { cancelToken: this.cancelSource.token });
      this.loading = false;
    },
  },
  watch: {
    open: function(){
      if (!this.open) {
        console.log('Request canceled by user');
        this.cancelSource.cancel('Request canceled by user');
      } else {
        this.init();
      }
    }
  }
};
</script>
<style scoped>
pre {
    font-family: inherit;
    border: 1px solid #ddd;
    color: #888;
    padding: 20px;
    border-radius: 4px;
    height: 400px;
    overflow: auto;
}
</style>