<template>
  <div>
    <div class="load-configurations">
      <v-select
        ref="storageConfigRef"
        v-model="selectedStorageConfig"
        :items="storedAnalyses"
        label="Load analysis"
        item-text="title"
        item-value="title"
        return-object
      />
    </div>
    <v-snackbar
      v-model="snackbar"
      :timeout="1500"
      color="success"
    >
      The analysis has been loaded
    </v-snackbar>
  </div>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    selectedStorageConfig: "",
    snackbar: false,
  }),
  props: {
    storedAnalyses: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    selectedStorageConfig: async function (value) {
      this.$emit('selectAnalysis', {date: value.date, repos: value.repos, title: value.title})
      this.snackbar = true;
    },
  }
}
</script>