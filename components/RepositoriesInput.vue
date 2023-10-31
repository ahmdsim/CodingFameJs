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
        @input="updatePath(index, normalize(item.path))"
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
      <v-alert
        v-if="unexrepos.indexOf(index) != -1"
        class="unexistence-alert"
        color="warning"
      >
        This repo doesn't exist
      </v-alert>
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
    data: () => ({
      unexrepos: []
    }),
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
      gitDirectoriesFound: function (index, repos) {
        this.$emit("gitDirectoriesFound", {index, repos});
      },
      updatePath: async function (index, path) {
        this.repos[index].path = path
        let existenceRs = await this.$axios.$get(
          `/existence?path=${escape(path)}`
        );
        const existence = existenceRs.isRepo;
        if (!existence) {
          if (existenceRs.repos.length) {
            this.gitDirectoriesFound(index, existenceRs.repos);
          } else if (this.unexrepos.indexOf(index) == -1) {
            this.unexrepos.push(index)
          }
        } else {
          if (this.unexrepos.indexOf(index) != -1) {
            this.unexrepos.splice(this.unexrepos.indexOf(index), 1)
          }
        }
      }
    },
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