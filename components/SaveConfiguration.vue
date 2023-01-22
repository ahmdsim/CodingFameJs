<template>
  <div>
    <v-btn color="primary" elevation="2" @click.stop="saveAnalyses">
      Save analyses
    </v-btn>
  </div>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    fileName: "",
  }),
  props: {
    analyses: {
      type: Array,
      default: () => []
    },
  },
  methods: {
    saveAnalyses: function () {
      const data = this.analyses.map((analysis) => ({title: analysis.title, date: analysis.date, repos: analysis.repos.map((repo) => ({path: repo.path, ignores: repo.ignoredFiles}))}))

      var analyses = localStorage.getItem("analyses");
      if (analyses === null) {
        localStorage.setItem("analyses", JSON.stringify(data));
      } else {
        var analyses = JSON.parse(localStorage.getItem("analyses"));
        analyses = analyses.concat(data)
        localStorage.setItem("analyses", JSON.stringify(analyses));
      }
      this.$emit('declineAll')
      this.$emit('reloadStorage')
    },
  },
};
</script>
