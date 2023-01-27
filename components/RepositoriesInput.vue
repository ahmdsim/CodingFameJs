<template>
  <div>
    <v-row v-for="(item, index) in repos" :key="index">
      <v-col cols="9">
        <v-text-field
          v-model="item.path"
          label="Repository"
          @input="item.path = normalize(item.path)"
        />
      </v-col>
      <v-col cols="3">
        <v-btn
          v-show="index !== repos.length - 1 || repos.length > 1"
          class="mx-2"
          fab
          dark
          color="primary"
          small
          @click="removeRepository(index)"
        >
          <v-icon dark>
            mdi-minus
          </v-icon>
        </v-btn>
        <v-btn
          v-show="index === repos.length - 1"
          class="mx-2"
          fab
          dark
          color="primary"
          small
          @click="addRepository"
        >
          <v-icon> mdi-plus </v-icon>
        </v-btn>
      </v-col>
    </v-row>
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
</style>