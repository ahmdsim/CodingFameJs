<template>
  <div>
    <v-btn
      color="primary"
      class="mx-2"
      fab
      dark
      small
      @click.stop="openDialog"
    >
      <v-icon>
        mdi-pencil
      </v-icon>
    </v-btn>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title> Edit ignores </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="files"
            counter
            label="Ignored files"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" elevation="2" @click="saveIgnores">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    dialog: false,
    files: "",
  }),
  props: {
    ignoredFiles: {
      type: Array,
      default: () => [],
    },
    repo: {
      type: String,
      default: () => '',
    },
  },
  methods: {
    saveIgnores: function () {
      this.$emit('ignores', { files: this.files.split("\n"), repo: this.repo });
      this.dialog = false;
    },
    openDialog: function() {
      this.files = this.ignoredFiles.join("\n")
      this.dialog = true;
    }
  },
};
</script>
