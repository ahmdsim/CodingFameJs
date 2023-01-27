<template>
  <v-treeview
    v-show="items.length > 0"
    :items="items"
    activatable
    item-key="path"
    open-on-click
    transition
    :active.sync="innerActiveFile"
    :open.sync="innerOpenFile"
  >
    <template #prepend="{ item, open }">
      <v-icon v-show="item.children && item.children.length > 0">
        {{ open ? "mdi-folder-open" : "mdi-folder" }}
      </v-icon>
      <v-icon v-else>
        mdi-file-document
      </v-icon>
    </template>

    <template #append="{ item }">
      <v-btn
        v-show="isIgnoredCallback(item.path, item.repo) === 1"
        icon
        @click.stop="stopIgnoreFileCallback(item.path, item.repo, item.children && item.children.length > 0)"
      >
        <v-icon color="red darken-2">
          mdi-plus-box
        </v-icon>
      </v-btn>
      <v-btn
        v-show="isIgnoredCallback(item.path, item.repo) === 2"
        icon
        @click.stop="stopIgnoreFileCallback(item.path, item.repo, item.children && item.children.length > 0)"
      >
        <v-icon color="red darken-1">
          mdi-plus-box
        </v-icon>
      </v-btn>
      <v-btn
        v-show="isIgnoredCallback(item.path, item.repo) === false"
        icon
        @click.stop="ignoreFileCallback(item.path, item.repo, item.children && item.children.length > 0)"
      >
        <v-icon>mdi-minus-box</v-icon>
      </v-btn>
    </template>
  </v-treeview>
</template>
<script>
import { Repository } from '~/models/repository'

/* eslint-disable */
export default {
  data: () => ({
    innerActiveFile: [],
    innerOpenFile: [],
  }),
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    activeFile: {
      type: Array,
      default: () => [],
    },
    openFile: {
      type: Array,
      default: () => [],
    },
    repo: {
        type: Repository
    },
    isIgnoredCallback: {
        type: Function
    },
    stopIgnoreFileCallback: {
        type: Function
    },
    ignoreFileCallback: {
        type: Function
    },
  },

  watch: {
    innerActiveFile: function (value) {
      this.$emit('update:activeFile', value)
    },
    innerOpenFile: function (value) {
      this.$emit('update:openFile', value)
    },
  }
};
</script>
