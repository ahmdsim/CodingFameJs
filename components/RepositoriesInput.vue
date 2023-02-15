<template>
  <div>
    <v-btn
      class="mb-5"
      color="primary"
      block
      @click="addRepository"
      >
      <v-icon> mdi-plus </v-icon> Add Repository
    </v-btn>
    <div class="repo" v-for="(item, index) in repos" :key="index">
      <v-row>
        <v-col cols="10">
          <v-text-field
            v-model="item.path"
            label="Repository"
            @input="item.path = normalize(item.path)"
          />
        </v-col>
        <v-col cols="2">
          <v-btn
            v-if="index !== repos.length - 1 || repos.length > 1"
            class="mx-2"
            fab
            x-small
            color="error"
            @click="removeRepository(index)"
          >
            <v-icon dark>
              mdi-trash-can
            </v-icon>
          </v-btn>
        </v-col>
      </v-row>
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
  border: 1px solid #eee;
  margin-bottom: 15px;
  border-radius: 4px;
  padding: 0 20px;
}
</style>