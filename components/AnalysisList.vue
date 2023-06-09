<template>
  <div>
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-item-group class="button-group">
          <v-btn
            large
            class="analyze-button"
            color="primary"
            elevation="2"
            @click="analize"
          >
            <v-icon>mdi-google-analytics</v-icon>
            Analyze
          </v-btn>
          <v-btn
            large
            color="primary"
            v-bind="attrs"
            elevation="2"
            class="no-margin"
            v-on="on"
          >
            <v-icon color="white">
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </v-item-group>
      </template>
      <v-list min-width="200px">
        <v-list-item class="text-right">
          <span v-if="analyses.length == 0">
            No analyses
          </span>
          <v-btn
            v-else
            text
            block
            color="error"
            class="clear-button"
            @click="deleteAll"
          >
            <v-icon small>
              mdi-cancel
            </v-icon>
            Delete All Analyses
          </v-btn>
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
      label="Include the time report"
    />
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
.analyze-button {
  width: calc( 100% - 78px );
  margin: 0 !important;
}
.persistence-checkbox {
  margin: 0px;
}
.button-group {
  display: flex;
  flex-wrap: wrap;
}

.button-group > .v-btn {
  margin: 5px;
  border-radius: 0;
}

.button-group > .v-btn:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.button-group > .v-btn:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.no-margin {
  margin: 0 !important;
}
</style>