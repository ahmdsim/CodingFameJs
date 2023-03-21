<template>
  <div>
    <v-btn
      class="mb-4"
      color="primary"
      block
      text
      @click="addRepository"
    >
      <v-icon> mdi-plus </v-icon> Add Repository
    </v-btn>
    <div v-for="(item, index) in repos" :key="index" class="repo">
      <v-text-field
        v-model="item.path"
        label="Repository"
        @input="item.path = normalize(item.path)"
      />
      <v-btn
        v-if="index !== repos.length - 1 || repos.length > 1"
        class="mx-2"
        fab
        x-small
        color="error"
        text
        @click="removeRepository(index)"
      >
        <v-icon dark>
          mdi-trash-can
        </v-icon>
      </v-btn>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
import normalize from "normalize-path";
export default {
    props: {
      repos: {
        type: Array,
        default: () => []
      }
    },
    methods: {
      normalize: function (str) {
        str = normalize(str);
        return str;
      },
      addRepository: function () {
        this.$emit("addRepository");
      },
      removeRepository: function (index) {
        this.$emit("removeRepository", {index: index});
      },
    }
}
</script>
<style scoped>
.mx-2 {
  margin: 20px;
}
.repo {
  background: #fff;
  margin-bottom: 15px;
  border-radius: 4px;
  padding: 4px 70px 0 20px;
  position: relative;
  box-shadow: 1px 1px 4px #0000000a;
}
.repo button {
  position: absolute;
  top: 0;
  right: 10px;
}
</style>