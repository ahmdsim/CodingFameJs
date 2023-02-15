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
    <v-file-input
      ref="fileSelectedRef"
      accept=".cfj"
      chips
      label="Import configuration"
      @change="configFileSelected"
    />
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
  methods: {
    configFileSelected: function (configFile) {
      if (configFile) {
        const reader = new FileReader();
        reader.readAsText(configFile);
        reader.onload = (configFile) => this.loadConfiguration(configFile.target.result, configFile.name);
        this.snackbarText = "The configuration has been imported"
        this.snackbar = true;
        this.$refs['fileSelectedRef'].reset();
      }
    },
    loadConfiguration: function (data, name) {
      const parsedData = JSON.parse(data);
      console.log(parsedData)
      if (parsedData && parsedData.repos && parsedData.date) {
        this.$emit('selectAnalysis', {date: parsedData.date, repos: parsedData.repos, title: name});
      }
    },
  },
  watch: {
    selectedStorageConfig: async function (value) {
      this.$emit('selectAnalysis', {date: value.date, repos: value.repos, title: value.title})
      this.snackbar = true;
    },
  }
}
</script>