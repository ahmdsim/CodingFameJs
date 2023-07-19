<template>
  <v-row justify="space-around">
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-source-commit</v-icon>
          <div class="stats-headline">Commits</div>
          <div class="stats-value">{{ repos.reduce((a, b) => a + b.commits, 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-text-box-plus-outline</v-icon>
          <div class="stats-headline">Lines added</div>
          <div class="stats-value">+{{ repos.reduce((a, b) => a + (b.lines.added || 0), 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-text-box-minus-outline</v-icon>
          <div class="stats-headline">Lines Deleted</div>
          <div class="stats-value">-{{ repos.reduce((a, b) => a + (b.lines.deleted || 0), 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
</v-row>
</template>
<script>
/* eslint-disable */
export default {
  props: {
    repos: {
        type: Array,
        default: () => []
    },
  },
}
</script>
