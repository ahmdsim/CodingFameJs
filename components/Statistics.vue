<template>
  <v-row justify="space-around">
    <v-col class="scrollable" cols="6">
      <div class="repositories-list">
        <v-card
          v-for="repository in repos"
          :key="repository.path"
          class="mb-2"
          elevation="4"
        >
          <v-card-title>{{ repository.path }}</v-card-title>
          <v-card-text>
            <div class="commits-count">
              Commits: {{ repository.commits }}
            </div>
            <div class="lines-of-code">
              Lines of code: +{{ repository.lines.added }} -{{
                repository.lines.deleted
              }} Total: {{ repository.lines.added - repository.lines.deleted }}
            </div>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>Total</v-card-title>
          <v-card-text>
            {{ repos.reduce((a, b) => a + b.commits, 0) }} Commits
            <br>
            {{ repos.reduce((a, b) => a + b.lines.added, 0) }}
            Lines added <br>
            {{ repos.reduce((a, b) => a + b.lines.deleted, 0) }}
            Lines deleted <br>
          </v-card-text>
        </v-card>
      </div>
    </v-col>
    <v-col cols="6">
      <div class="author-list">
        <v-dialog
          v-model="overlay"
          width="700px"
          max-height="600px;"
          scrollable
          persistent
          class="dialog-window"
        >
          <v-card max-height="600px" class="tree-card">
            <v-card-text max-height="600px">
              <div>
                <div class="close-icon">
                  <v-icon class="close-box" @click="overlay=false">
                    mdi-close-box
                  </v-icon>
                </div>
                <v-treeview
                  v-if="authors.length > 0"
                  :items="authors"
                  item-key="id"
                  open-on-click
                  hoverable
                  dense
                  transition
                  activatable
                >
                  <template #prepend="{ item }">
                    <v-icon v-if="item.hash">
                      mdi-source-commit
                    </v-icon>
                    <v-icon v-else-if="item.commits">
                      mdi-account
                    </v-icon>
                    <v-icon v-else>
                      mdi-file-document
                    </v-icon>
                  </template>
                  <template #label="{ item }">
                    <div v-if="item.hash || item.commits">{{ item.name }}</div>
                    <div v-else>
                      <span v-if="isIgnoredCallback(item.name, item.repopath)" class="ignored-files">{{ item.name }}</span>
                      <span v-else>{{ item.name }}</span>
                    </div>
                  </template>
                  <template #append="{ item }">
                    <div v-if="!item.hash && !item.commits">
                      {{ item.LoC }}
                      <v-icon @click="ignoreFileCallback(item.repopath + '/' + item.name, item.repopath)">
                        mdi-file-document-remove
                      </v-icon>
                      <v-icon @click="ignoreFileCallback(item.repopath + '/' + item.name.split('/').slice(0, -1).join(`/`), item.repopath, true)">
                        mdi-folder-remove
                      </v-icon>
                      <v-btn text class="ignore-ext-btn" @click="ignoreExtensionCallback(item.repopath, item.name.split('.').pop())">
                        .ext
                      </v-btn>
                    </div>
                  </template>
                </v-treeview>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
        <v-card
          class="mx-auto"
        >
          <v-toolbar
            color="primary"
            dark
          >
            <v-toolbar-title>Top authors</v-toolbar-title>
            <v-spacer />
          </v-toolbar>
          <v-list three-line class="top-authors-toolbar">
            <v-list-group
              v-for="author in sortedAuthors"
              :key="author.email"
              v-model="author.active"
              no-action
            >
              <template #activator>
                <v-list-item-content>
                  <v-list-item-title>{{ author.email }}</v-list-item-title>
                  Commits: {{ author.commits }} <br> LoC: +{{ author.lines.added }} -{{
                    author.lines.deleted }} T: {{ author.lines.added - author.lines.deleted }}
                </v-list-item-content>
              </template>
              <v-list-item
                v-for="(commit, index) in author.details"
                :key="commit[0]"
                class="commit-info"
                :class="{oddCommit: index % 2 == 0}"
                @click="overlay = true"
              >
                <v-tooltip bottom>
                  <template #activator="{ on, attrs }">
                    <span
                      v-if="index % 2 == 0"
                      v-bind="attrs"
                      v-on="on"
                    >{{ commit[1] }} LoC: {{ commit[2][0] }} -{{ commit[2][1] }} T: {{ commit[2][0] - commit[2][1] }}</span>
                    <span
                      v-else
                      v-bind="attrs"
                      v-on="on"
                    >{{ commit[1] }} LoC: {{ commit[2][0] }} -{{ commit[2][1] }} T: {{ commit[2][0] - commit[2][1] }}</span>
                  </template>
                  <span><h3>hash:</h3> {{ commit[0] }}</span>
                </v-tooltip>
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
      </div>
    </v-col>
  </v-row>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    overlay: false,
  }),
  props: {
    repos: {
        type: Array,
        default: () => []
    },
    sortedAuthors: {
        type: Array,
        default: () => []
    },
    ignoreFileCallback: {
      type: Function
    },
    ignoreExtensionCallback: {
      type: Function
    },
    isIgnoredCallback: {
        type: Function
    },
  },
  computed: {
    authors: function () {
      let authors = [];
      let i = 0;
      this.sortedAuthors.forEach((author) => {
        let formatedAuthor = {name: author.email, children: [], commits: true, id: i};
        i += 1;
        author.details.forEach((commit) => {
          let formatedCommit = {id: i++, name: commit[1], children: commit[3].map((file) => ({id: i++, name: file.filepath, LoC:`LoC: ${file.added - file.deleted}`, children: [], repopath: commit[4]})), hash: commit[0]}
          formatedAuthor.children.push(formatedCommit);
        });
        i++;
        authors.push(formatedAuthor)
      })
      return authors
    }
  }
}
</script>
<style scoped>
.scrollable {
  max-height: 500px;
  overflow-y: auto;
}
.author-list .v-list{
  height: 410px;
  overflow-y: auto;
}
.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 0 !important;
}
.oddCommit {
  background-color: #F5F5F5;
}
.dialog-window {
  padding-top: 16px !important;
}
.tree-card {
  padding: 16px;
}
.close-icon {
  text-align:left;
}
.close-box {
  float:right;
}
.ignored-files {
  text-decoration:line-through;
}
.ignore-ext-btn {
  padding: 8px !important;
  color: rgb(111, 111, 111);
}
.top-authors-toolbar {
  padding: 0px 16px;
}
.commit-info {
  min-height: 36px;
}
</style>