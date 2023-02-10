<template>
  <div>
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn-toggle class="analize-button">
          <v-btn active-class="" color="secondary" elevation="2" @click="analize">
            Analize
          </v-btn>
          <v-btn
            color="secondary"
            dark
            v-bind="attrs"
            elevation="2"
            v-on="on"
          >
            <v-icon color="white">
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </v-btn-toggle>
      </template>
      <v-list min-width="200px">
        <v-list-item class="text-right">
          <span v-if="analyses.length == 0">
            No analyses
          </span>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <span
                v-bind="attrs"
                v-on="on"
              >
                <v-btn
                  absolute
                  right
                  x-small
                  color="error"
                  class="clear-button"
                  @click="deleteAll"
                >
                  <v-icon x-small>
                    mdi-cancel
                  </v-icon>
                </v-btn>
              </span>
            </template>
            <span>Are you sure? All analyzes will be deleted</span>
          </v-tooltip>
        </v-list-item>
        <v-list-item
          v-for="(item, index) in analyses"
          :key="index"
        >
          <v-list-item-title @click="changeAnalize(index)">
            {{ item.title }}
          </v-list-item-title>
          <v-icon @click="changeSelectedAnalysis(index)">
            mdi-pencil
          </v-icon>
          <v-icon @click="deleteOne(index)">
            mdi-delete
          </v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-text-field
      v-if="selectedAnalysis.idx || selectedAnalysis.idx == 0"
      v-model="selectedAnalysis.title"
    >
      <v-icon
        slot="append"
        @click="changeTitle"
      >
        mdi-content-save
      </v-icon>
    </v-text-field>
    <v-checkbox
      v-model="includeImpact"
      label="Time consuming"
    />
    <router-link to="/persistence_of_code">
      <v-btn class="primary">
        Persistence
      </v-btn>
    </router-link>
    <!-- <v-checkbox
      v-model="includePersistence"
      label="Persistence of code"
      class="persistence-checkbox"
    ></v-checkbox> -->
  </div>
</template>
<script>
/* eslint-disable */

export default {
  data: () => ({
    selectedAnalysis: {idx: null},
    includeImpact: false,
    includePersistence: false,
  }),
  props: {
    analyses: {
      type: Array,
      default: () => []
    }      
  },
  methods: {
    deleteAll: function () {
        this.$emit("declineAll")
    },
    changeAnalize: function (idx) {
        const data = this.analyses[idx];
        this.$emit("changeAnalize", {analysis: data})
    },
    deleteOne: function (idx) {
        this.$emit("declineOne", {index: idx})
    },
    changeTitle: function () {
      if (this.selectedAnalysis.title) {
        this.$emit("changeTitle", this.selectedAnalysis)
        this.selectedAnalysis = {idx: null}
      }
    },
    changeSelectedAnalysis: function (idx) {
      this.selectedAnalysis = {idx: idx, title: this.analyses[idx].title}
    },
    analize: function () {
        this.$emit("analize");
    }
  },
  watch: {
    includeImpact: function (value) {
      this.$emit('isImpact', {impact: value})
    },
    includePersistence: function (value) {
      this.$emit('isPersistence', {persistance: value})
    }
  }
}
</script>
<style scoped>
.analize-button {
  background-color: gray;
}
.clear-button {
  top: 13px;
}
.v-btn-toggle > .v-btn.v-btn--active {
  background-color: #424242 !important;
}
.persistence-checkbox {
  margin: 0px;
}
</style>