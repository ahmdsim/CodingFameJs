<template>
  <div>
    <v-item-group>
      <v-btn text @click.stop="saveAnalyses">
        <v-icon left dark>
          mdi-content-save
        </v-icon>
        Save Analysis
      </v-btn>
      <v-btn text @click.stop="dialog = true">
        <v-icon left dark>
          mdi-export
        </v-icon>
        Export Configuration
      </v-btn>
      <v-dialog v-model="dialog" max-width="500px">
        <v-card>
          <v-card-title> Export configuration </v-card-title>
          <v-card-text>
            <v-text-field v-model="fileName" label="File name" />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" elevation="2" @click="exportConfiguration">
              Export
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-snackbar
        v-model="snackbar"
        :timeout="1500"
        color="success"
      >
        The analysis has been saved.
      </v-snackbar>
    </v-item-group>
  </div>
</template>
<script>
/* eslint-disable */
import { saveAs } from "file-saver"

export default {
  data: () => ({
    fileName: "",
    dialog: false,
    snackbar: false,
  }),
  props: {
    analyses: {
      type: Array,
      default: () => []
    },
    repos: {
      type: Array,
      default: () => []
    },
    date: {
      type: Array,
      dafault: [new Date(), new Date()]
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
      this.snackbar = true;
    },
    exportConfiguration: function () {
      var configuration = {date: this.date, repos: this.repos.map((repo) => ({path: repo.path, ignores: repo.ignoredFiles}))}
      console.log(configuration)

      var serializedData = JSON.stringify(configuration);
      console.log(serializedData)
      const blob = new Blob([serializedData], {
        type: "text/plain;charset=utf-8",
      });

      if (!this.fileName || this.fileName.length === 0) {
        this.fileName = new Date().toISOString().substring(0, 10);
      }

      saveAs(blob, `${this.fileName}.cfj`);
      this.dialog = false;
    }
  },
};
</script>
