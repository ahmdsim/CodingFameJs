<template>
  <div id="wrapper">
    <!-- LOGO -->
    <div class="logo">
      <img src="/SmartInMediaLogo.svg">
    </div>

    <!-- MENU -->
    <ul class="menu">
      <li>
        <SaveConfiguration
          :analyses="analyses"
          :repos="repos"
          :date="date"
          @reloadStorage="reloadAnalysesStorage"
          @declineAll="declineAllAnalysis"
        />
      </li>
      <li>
        <v-btn text @click.stop="loadConfigurationDialog = true">
          <v-icon left dark>
            mdi-file-import
          </v-icon>
          Load Configuration
        </v-btn>
        <v-dialog v-model="loadConfigurationDialog" max-width="500px">
          <v-card>
            <v-card-title> Load Configuration </v-card-title>
            <v-card-text>
              <LoadConfiguration
                :stored-analyses="storedAnalyses"
                @selectAnalysis="selectAnalysis"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
      </li>
      <li>
        <router-link to="/persistence_of_code">
          <v-btn text>
            <v-icon left dark>
              mdi-chart-line
            </v-icon>
            Persistance
          </v-btn>
        </router-link>
      </li>
    </ul>
    <v-row>
      <!-- Left dashboard menu-->
      <v-col cols="4" class="aside">
        <v-tabs transparent no-transition vertical>
          <v-tab><v-icon>mdi-source-branch</v-icon></v-tab>
          <v-tab><v-icon>mdi-file-minus</v-icon></v-tab>
          <!-- Repository Tab -->
          <v-tab-item>
            <div class="repositories-input">
              <RepositoriesInput
                :repos="repos"
                @addRepository="addRepository"
                @removeRepository="removeRepository"
              />
            </div>
            <div class="analyze-button">
              <AnalysisList
                :analyses="analyses"
                @declineAll="declineAllAnalysis"
                @changeAnalize="chooseAnalysis"
                @declineOne="declineOne"
                @analize="analize"
                @changeTitle="changeAnalysisTitle"
                @isImpact="switchImpact"
                @isPersistence="switchPersistence"
              />
            </div>
          </v-tab-item>
          <!-- Edit ignored files Tab -->
          <v-tab-item>
            <div class="select-repository">
              <v-select
                v-model="selectedRepoPath"
                :items="repos"
                label="Select repository"
                item-text="path"
                item-value="value"
              />
            </div>
            <EditIgnores
              :repo="selectedRepoPath"
              :ignored-files="selectedIgnoredFiles"
              @ignores="onChangeIgnores"
            />
            <div class="project-tree">
              <project-tree
                :items="selectedRepoTree"
                :active-file.sync="fileSelected"
                :open-file.sync="fileOpened"
                :is-ignored-callback="isIgnored"
                :stop-ignore-file-callback="stopIgnoreFile"
                :ignore-file-callback="ignoreFile"
              />
            </div>
            <FilePreview
              :file-preview="filePreview"
              :selected-file-name="selectedFileName"
              :last-commits="lastCommits"
            />
          </v-tab-item>
        </v-tabs>
      </v-col>

      <!-- Main content-->
      <v-col cols="8" class="dashboard-content">
        <h1 class="dashboard-title">
          Results
        </h1>
        <!-- Active Filters-->
        <div class="filters">
          <v-chip
            class="ma-2"
            color="primary"
            text-color="white"
            @click.stop="dateDialog = true"
          >
            <v-icon small class="mr-2">
              mdi-calendar-filter
            </v-icon>
            {{ dateRange }}
          </v-chip>
          <v-dialog v-model="dateDialog" max-width="500px">
            <v-card>
              <v-card-title>Change Date</v-card-title>
              <v-card-text>
                <DatePicker
                  :date-prop="date"
                  :date-range="dateRange"
                  @changeDate="onChangeDate"
                />
              </v-card-text>
              <v-card-actions class="pb-5">
                <v-btn color="primary" elevation="2" @click="dateDialog = false">
                  Apply Changes
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
        <GeneralInfo
          :repos="repos"
        />
        <v-row>
          <v-col>
            <div class="mt-3">
              <v-card flat tile style="height: 448px;">
                <template id="persistenceTabs">
                  <client-only>
                    <v-tabs v-model="tab" align-with-title>
                      <v-tabs-slider />
                      <v-tab v-for="item in tabItems" :key="item">
                        {{ item }}
                      </v-tab>
                      <v-tab v-if="isImpact">
                        Impact
                      </v-tab>
                      <v-tab v-if="isPersistence">
                        Persistence of code
                      </v-tab>
                    </v-tabs>
                  </client-only>
                </template>
                <template>
                  <v-window
                    v-model="window"
                    show-arrows
                  >
                    <v-window-item
                      v-for="(repo, index) in repos"
                      :key="index"
                    >
                    <h3 style="text-align: center;">{{ repo.path }}</h3>
                    <v-tabs-items v-model="tab">
                  <v-tab-item>
                    <v-card flat class="commit-chart-window">
                      <commits-and-code-chart
                        :path="repo.path"
                        :rawData="rawData"
                        :dates="date"
                        @stopSpiner="isSpiner = false"
                      />
                      <div v-if="isSpiner" class="chart-spiner">
                        <v-progress-circular
                          :size="70"
                          :width="7"
                          color="primary"
                          indeterminate
                        />
                      </div>
                      <DateChanger
                        :date="date"
                        :date-range="dateRange"
                        @changeDate="onChangeDate"
                        @analize="analize"
                      />
                    </v-card>
                  </v-tab-item>
                  <v-tab-item>
                    <v-card flat>
                      <div
                        v-if="mainPieData[repo.path] && mainPieData[repo.path].length < 2"
                        class="extensionsChart"
                      >
                        <div>
                          <v-progress-circular
                            :size="70"
                            :width="7"
                            color="primary"
                            indeterminate
                          />
                        </div>
                      </div>
                      <FileExtensionsChart
                        v-else
                        :pieData="mainPieData[repo.path]"
                        :status="statusRepos[repo.path]"
                        @stopSpinerExtensions="isSpinerExtensions = false"
                      />
                      <template>
                        <div>
                          <v-alert
                            v-model="alert"
                            border="left"
                            close-text="Close Alert"
                            color="primary"
                            dark
                          >
                            <v-row>
                              <v-col cols="10">
                                Are you sure you want to analize this repo without
                                any ignored files? It may cause to unlimited
                                calculations that will not end
                              </v-col>
                              <v-col cols="2">
                                <v-btn @click="useExtensionsManager(repo)">
                                  Anyway analize
                                </v-btn>
                              </v-col>
                            </v-row>
                          </v-alert>
                          <v-btn v-if="!alert || statusRepos[repo.path] == 'failed'" @click="useExtensionsManager(repo)">
                            Make analysis
                          </v-btn>
                        </div>
                      </template>
                    </v-card>
                  </v-tab-item>
                  <v-tab-item v-if="isImpact">
                    <v-card flat>
                      <ImpactCharts
                        :pieDatas="pieDatas[repo.path]"
                        :personalImpact="personalImpact[repo.path]"
                        :extensions="mainPieData[repo.path]"
                      />
                    </v-card>
                  </v-tab-item>
                  <v-tab-item v-if="isPersistence">
                    <v-card flat>
                      <PersistenceChart @persistenceData="changePersistenceData" />
                    </v-card>
                  </v-tab-item>
                </v-tabs-items>
                    </v-window-item>
                    <v-window-item
                    >
                    <h3 style="text-align: center;">All repos</h3>
                    <v-tabs-items v-model="tab">
                  <v-tab-item>
                    <v-card flat class="commit-chart-window">
                      <commits-and-code-chart
                        :path="'all'"
                        :rawData="rawData"
                        :dates="date"
                        @stopSpiner="isSpiner = false"
                      />
                      <div v-if="isSpiner" class="chart-spiner">
                        <v-progress-circular
                          :size="70"
                          :width="7"
                          color="primary"
                          indeterminate
                        />
                      </div>
                      <DateChanger
                        :date="date"
                        :date-range="dateRange"
                        @changeDate="onChangeDate"
                        @analize="analize"
                      />
                    </v-card>
                  </v-tab-item>
                  <v-tab-item>
                    <v-card flat>
                      <FileExtensionsChart
                        v-if="!isSpinerExtensions"
                        :pieData='mainPieDataAll'
                        @stopSpinerExtensions="isSpinerExtensions = false"
                      />
                      <div v-if="isSpinerExtensions" class="chart-spiner">
                        <v-progress-circular
                          :size="70"
                          :width="7"
                          color="primary"
                          indeterminate
                        />
                      </div>
                    </v-card>
                  </v-tab-item>
                  <v-tab-item v-if="isImpact">
                    <v-card flat>
                      <ImpactCharts
                        :status="success"
                        :pieDatas="pieDatasAll"
                        :personalImpact="personalImpactAll"
                      />
                    </v-card>
                  </v-tab-item>
                  <v-tab-item v-if="isPersistence">
                    <v-card flat>
                      <PersistenceChart @persistenceData="changePersistenceData" />
                    </v-card>
                  </v-tab-item>
                </v-tabs-items>
                    </v-window-item>
                  </v-window>
                </template>
              </v-card>
            </div>
          </v-col>
        </v-row>
        <Statistics
          :repos="repos"
          :sorted-authors="sortedAuthors"
          :ignore-file-callback="ignoreFile"
          :ignore-extension-callback="ignoreExtension"
          :is-ignored-callback="isIgnored"
        />
      </v-col>
    </v-row>
    <router-view />
  </div>
</template>
<script>
/* eslint-disable */
import normalize from "normalize-path";
import minimatch from "minimatch";
import { mapMutations, mapActions, mapGetters } from "vuex";
import { Repository } from "~/models/repository";
import { Author } from "~/models/author";
import ProjectTree from "../components/ProjectTree.vue";
import CommitsAndCodeChart from "../components/CommitsAndCodeChart.vue";
import SaveConfiguration from "../components/SaveConfiguration.vue";
import DatePicker from "../components/DatePicker.vue";
import EditIgnores from "../components/EditIgnores.vue";
import Statistics from "../components/Statistics.vue";
import DateChanger from "../components/DateChanger.vue";
import LoadConfiguration from "../components/LoadConfiguration.vue";
import RepositoriesInput from "../components/RepositoriesInput.vue";
import FilePreview from "../components/FilePreview.vue";
import FileExtensionsChart from "../components/FileExtensionsChart.vue";
import AnalysisList from "../components/AnalysisList.vue";
import ImpactCharts from "../components/ImpactCharts.vue";
import PersistenceChart from "../components/PersistenceChart.vue";
import GeneralInfo from "../components/GeneralInfo.vue";

export default {
  components: {
    ProjectTree,
    CommitsAndCodeChart,
    SaveConfiguration,
    DatePicker,
    EditIgnores,
    Statistics,
    DateChanger,
    LoadConfiguration,
    RepositoriesInput,
    SaveConfiguration,
    FilePreview,
    FileExtensionsChart,
    AnalysisList,
    ImpactCharts,
    PersistenceChart,
    GeneralInfo,
  },
  data: () => ({
    filePreview: "",
    selectedFileName: "",
    selectedRepoPath: "",
    selectedRepoTree: [],
    fileSelected: [],
    fileOpened: [],
    date: [
      new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substring(0, 10),
      new Date(Date.now()).toISOString().substring(0, 10),
    ],
    authors: [],
    files: [],
    repos: [],
    rawData: {},
    lastCommits: [],
    isSpiner: false,
    windowLength: 2,
    windowOnboarding: 0,
    isSpinerExtensions: false,
    analyses: [],
    storedAnalyses: [],
    tab: null,
    tabItems: ["Commit and Code", "Extensions"],
    isImpact: false,
    isPersistence: false,
    alert: true,
    loadConfigurationDialog: false,
    dateDialog: false,
    window: 0,
    pieDataRepos: {},
    mainPieDatasRepos: {},
    personalImpactRepos: {},
    statusRepos: {},
  }),
  computed: {
    selectedIgnoredFiles: function () {
      if (
        this.selectedRepoPath &&
        this.repos.find((x) => x.path == this.selectedRepoPath)
      ) {
        return this.repos.find((x) => x.path == this.selectedRepoPath)
          .ignoredFiles;
      }
      return [];
    },
    sortedAuthors: function () {
      var result = this.authors;
      result.sort(function (a, b) {
        if (a.lines.added - a.lines.deleted < b.lines.added - b.lines.deleted) {
          return 1;
        }
        if (a.lines.added - a.lines.deleted > b.lines.added - b.lines.deleted) {
          return -1;
        }
        return 0;
      });
      return result.length > 10 ? result.slice(0, 10) : result;
    },
    dateRange: function () {
      return this.date.join(" - ");
    },
    ignore: function () {
      if (this.repos.length > 0) {
        var ignoredFiles = this.repos.reduce(
          (p, c) => [...p, ...c.ignoredFiles],
          []
        );
        return ignoredFiles && ignoredFiles.length > 0
          ? ignoredFiles.join(", ")
          : [];
      }
    },
    impact: function () {
      return this.getImpact();
    },
    personalImpact: function () {
      this.reloadCandCData()
      return this.personalImpactRepos;
    },
    pieDatas: function () {
      this.reloadCandCData()
      return this.pieDataRepos;
    },
    mainPieData: function () {
      this.reloadCandCData()
      return this.mainPieDatasRepos;
    },
    mainPieDataAll: function () {
      let all = []
      let preMain = Object.values(this.mainPieData).flat().filter((ext) => ext[1] != 'Lines of code')
      let uniqueKeys = preMain.map((ext) => ext[0]).filter(this.onlyUnique)
      uniqueKeys.forEach((ext) => {
        all.push([ext, preMain.filter((exten) => exten[0] == ext).reduce((sum, current) => sum + current[1], 0)])
      })
      console.log('final result', [['Type of files', 'Lines of code']].concat(all))
      return [['Type of files', 'Lines of code']].concat(all)
    },
    pieDatasAll: function () {
      let all = []
      let preMain = Object.values(this.pieDatas).flat()
      let uniqueKeys = preMain.map((ext) => ext['ext']).filter(this.onlyUnique)

      uniqueKeys.forEach((ext) => {
        var extAuthors = preMain.filter((exten) => exten['ext'] == ext).reduce((sum, current) => sum.concat(current['pieData']), []).filter((stat) => stat[1] != 'Lines of code')
        var uniqueAuthors = extAuthors.map((author) => author[0]).filter(this.onlyUnique)
        var preAll = [['Author', 'Lines of code']]
        uniqueAuthors.forEach((author) => {
          preAll.push([author, extAuthors.filter((auth) => auth[0] == author).reduce((sum, current) => sum + current[1], 0)])
        })
        all.push({ext: ext, pieData:  preAll})
      })
      return all
    },
    personalImpactAll: function () {
      let all = []
      let preMain = Object.values(this.personalImpact).flat().filter((author) => author[1] != 'Lines of code')
      let uniqueKeys = preMain.map((author) => author[0]).filter(this.onlyUnique)
      uniqueKeys.forEach((author) => {
        all.push([author, preMain.filter((auth) => auth[0] == author).reduce((sum, current) => sum + current[1], 0)])
      })
      console.log('final result', [['Author', 'Lines of code']].concat(all))
      return [['Author', 'Lines of code']].concat(all)
    },
  },
  async mounted() {
    if (process.client) {
      this.isSpinerExtensions = true;
      if (localStorage.getItem("hasData") == 1) {
        if (localStorage.getItem("date")) {
          this.date = JSON.parse(localStorage.getItem("date"));
        }
        if (localStorage.getItem("repos")) {
          this.repos = JSON.parse(localStorage.getItem("repos"));
          if (this.repos.length) {
            let repository = this.repos[0];
            const fileTree = await this.$axios.$get(
              `/tree?repo=${escape(repository.path)}`
            );
            this.selectedRepoPath = repository.path;
            this.selectedRepoTree = fileTree;
          }
        }
        // if (localStorage.getItem("rawData")) {
        //   this.rawData = JSON.parse(localStorage.getItem("rawData"));
        // }
      } else {
        if (
          localStorage.getItem("repos") &&
          JSON.parse(localStorage.getItem("repos")).length > 0
        ) {
          this.repos = JSON.parse(localStorage.getItem("repos"));
          this.analize();
        } else {
          this.repos.push(new Repository("", [], [], 0, 0));
        }
      }
      this.reloadAnalysesStorage();
      this.analize();
    }
  },
  async fetch() {},
  methods: {
    normalize: function (str) {
      str = normalize(str);
      return str;
    },
    ...mapMutations({
      updateRepoData: "ExtensionsManager/updateRepoData",
    }),
    ...mapActions({
      reloadImpact: "ExtensionsManager/reloadImpact",
    }),
    ...mapGetters({
      getImpact: "ExtensionsManager/getImpact",
      getMainData: "ExtensionsManager/getMainPieData",
      getPieDatas: "ExtensionsManager/getPieDatas",
      getPersonalImpact: "ExtensionsManager/getPersonalImpact",
      getStatus: 'ExtensionsManager/getStatus',
    }),
    onlyUnique: function (value, index, array) {
      return array.indexOf(value) === index;
    },
    switchImpact: function (data) {
      this.isImpact = data.impact;
    },
    declineAllAnalysis: function () {
      this.analyses = [];
    },
    declineOne: function (number) {
      this.analyses.splice(number.index, 1);
    },
    changeAnalysisTitle: function (data) {
      this.analyses[data.idx].title = data.title;
    },
    selectAnalysis: function (data) {
      this.date = data.date;
      this.repos = data.repos.map(
        (repo) => new Repository(repo.path, repo.ignores, [], 0, 0)
      );
      this.analize();
      this.changeAnalysisTitle({
        idx: this.analyses.length - 1,
        title: data.title,
      });
    },
    chooseAnalysis: function (analysisData) {
      const analysis = analysisData.analysis;
      this.repos = analysis.repos;
      this.authors = analysis.authors;
      this.rawData = analysis.rawData;
      this.date = analysis.date;
    },
    addRepository: function () {
      this.repos.push(new Repository("", [], [], 0, 0));
    },
    removeRepository: function (index) {
      this.repos.splice(index.index, 1);
    },
    reloadAnalysesStorage: function () {
      if (process.client) {
        this.storedAnalyses = [];
        if (localStorage.getItem("analyses")) {
          this.storedAnalyses = JSON.parse(localStorage.getItem("analyses"));
        }
      }
    },
    reloadCandCData: function () {
      this.personalImpactRepos[this.getPersonalImpact()['repopath']] = this.getPersonalImpact()['personalImpact']
      this.pieDataRepos[this.getPieDatas()['repopath']] = this.getPieDatas()['pieDatas']
      this.mainPieDatasRepos[this.getMainData()['repopath']] = [["Type of files", "Lines of code"]].concat(this.getMainData()['mainPieData']);
      this.statusRepos[this.getPersonalImpact()['repopath']] = this.getStatus()
    },
    analize: async function () {
      this.isSpiner = true;
      this.authors = [];
      this.rawData = {};
      let analysis = { rawData: [], authors: [] };
      this.repos.forEach(async (repository) => {
        if (repository.path === "") {
          return;
        }
        let dates = "";
        if (this.date.length === 2) {
          dates = `&after=${this.date[0]}&before=${this.date[1]}`;
        }
        let ignore = "";

        if (repository.ignoredFiles.length > 0) {
          ignore = "&ignore=" + escape(repository.ignoredFiles.join(","));
        }
        const gitlog = await this.$axios.$get(
          `/gitlog?repo=${escape(repository.path)}${dates}${ignore}`
        );

        const rawData = await this.$axios.$get(
          `/gitlog?repo=${escape(repository.path)}${dates}${ignore}&raw=true`
        );

        analysis.rawData.push(rawData);
        var protoRawData = {}
        protoRawData[repository.path] = rawData
        this.rawData = Object.assign({}, this.rawData, protoRawData)
        const authors = [];
        for (const [key, value] of Object.entries(gitlog["authors"])) {
          if (this.authors.find((x) => x.email === key)) {
            let author = this.authors.find((x) => x.email === key);
            author.commits += value.commits;
            author.lines.added += value.lines.added;
            author.lines.deleted += value.lines.deleted;
            author.details = author.details.concat(value.details);
          } else {
            let newAuthor = new Author(
              key,
              null,
              value.commits,
              value.lines,
              value.details
            );
            authors.push(newAuthor);
            this.authors.push(newAuthor);
          }
        }

        const fileTree = await this.$axios.$get(
          `/tree?repo=${escape(repository.path)}`
        );

        repository.commits = gitlog.commits;
        repository.lines = gitlog.lines;
        repository.authors = authors;
        repository.tree = fileTree;
        analysis.authors = analysis.authors.concat(
          authors.filter((author) => !analysis.authors.includes(author))
        );
      });

      analysis.repos = structuredClone(this.repos);
      analysis.date = this.date;
      analysis.title = this.date.join(" ");
      this.analyses.push(analysis);

      if (this.repos.length > 0) {
        localStorage.repos = JSON.stringify(
          this.repos.map((repo) => {
            return {
              authors: repo.authors,
              commits: repo.commits,
              ignoredFiles: repo.ignoredFiles,
              lines: repo.lines,
              path: repo.path,
            };
          })
        );
        localStorage.date = JSON.stringify(this.date);
        localStorage.hasData = 1;

        if (!this.selectedRepoPath) {
          this.selectedRepoPath = this.repos[0].path;
        }
      } else {
        localStorage.hasData = 0;
      }
    },
    useExtensionsManager: function (repo) {
      if (this.selectedIgnoredFiles && this.selectedIgnoredFiles != [] || this.alert) {
        this.updateRepoData({
          repopath: repo.path,
          repotree: repo.tree,
          ignores: repo.ignoredFiles,
          fromDate: this.date[0]
        });
      }
      this.reloadImpact();
      this.alert = false;
    },
    ignoreFile: function (path, repositoryPath, isDirectory = false) {
      if (this.isIgnored(path, repositoryPath)) {
        return;
      }

      if (this.repos.find((x) => x.path === repositoryPath)) {
        let repo = this.repos.find((x) => x.path === repositoryPath);
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");

        if (isDirectory) {
          const dirPath = filePath + "/**";
          if (!repo.ignoredFiles.includes(dirPath)) {
            repo.ignoredFiles.push(dirPath);
          }
        }
        if (!repo.ignoredFiles.includes(filePath)) {
          repo.ignoredFiles.push(filePath);
        }
      }
    },
    ignoreExtension: function (repopath, ext) {
      if (this.repos.find((x) => x.path === repopath)) {
        let repo = this.repos.find((x) => x.path === repopath);
        repo.ignoredFiles.push(`*.${ext}`);
      }
    },
    isIgnored: function (path, repositoryPath) {
      path = normalize(path);
      repositoryPath = normalize(repositoryPath);
      let repo = this.repos.find((x) => x.path === repositoryPath);
      if (repo !== undefined) {
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");
        if (
          repo.ignoredFiles.find((x) =>
            minimatch(filePath, x, { matchBase: true })
          ) !== undefined
        ) {
          return 1;
        } else if (
          repo.ignoredFiles.find((x) => filePath.startsWith(x)) !== undefined
        ) {
          return 2;
        }
        return false;
      }
      return false;
    },
    stopIgnoreFile: function (path, repositoryPath, isDirectory = false) {
      if (!this.isIgnored(path, repositoryPath)) {
        return;
      }

      if (this.repos.find((x) => x.path === repositoryPath)) {
        let repo = this.repos.find((x) => x.path === repositoryPath);
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");

        if (isDirectory) {
          const dirPath = filePath + "/**";
          if (repo.ignoredFiles.includes(dirPath)) {
            repo.ignoredFiles = repo.ignoredFiles.filter((x) => x != dirPath);
          }
        }
        if (repo.ignoredFiles.includes(filePath)) {
          repo.ignoredFiles = repo.ignoredFiles.filter((x) => x != filePath);
        }
      }
    },
    switchPersistence: function (data) {
      this.isPersistence = data.persistance;
    },
    changePersistenceData: function (data) {
      // console.log(`/survival?repo=${escape(this.selectedRepoPath)}&after=${data.after}&before=${data.before}&date=${data.date}`)
      // let persistance = this.$axios.$get(`/survival?repo=${escape(this.selectedRepoPath)}&after=${data.after}&before=${data.before}&date=${data.date}`)
    },
    onChangeIgnores: function (updatedIgnores) {
      const repo = this.repos.find((x) => x.path === updatedIgnores.repo);
      if (repo) {
        repo.ignoredFiles = updatedIgnores.files.filter((x) => x != "");
      }
    },
    onChangeDate: function (updatedDate) {
      this.date = updatedDate.date;
    },
  },
  watch: {
    selectedIgnoredFiles: function (value) {
      this.alert = !(value && value.length != 0);
      localStorage.setItem("selectedIgnoredFiles", this.selectedIgnoredFiles);
      // console.log(value)
      // console.log(!(value && value.length != 0))
    },
    fileSelected: async function (value) {
      this.selectedFileName = value[0];
      this.filePreview = await this.$axios.$get(`/file?file=${escape(value)}`);
      this.lastCommits = await this.$axios.$get(
        `/gitblame?file=${escape(this.fileSelected)}`
      );
    },
    selectedRepoPath: async function (value) {
      this.isSpinerExtensions = true;
      localStorage.setItem("selectedRepoPath", value);
      if (this.repos.find((x) => x.path === value)) {
        const repo = this.repos.find((x) => x.path === value);
        this.selectedRepoTree = await this.$axios.$get(
          `/tree?repo=${escape(repo.path)}`
        );
        // this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
        // this.reloadImpact()
        return;
      }

      for (path in this.repos) {
        const repo = this.repos.find((x) => x.path === path);
        if (repo) {
          this.selectedRepoPath = path;
          this.selectedRepoTree = await this.$axios.$get(
            `/tree?repo=${escape(repo.path)}`
          );
          // this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
          // this.reloadImpact()
          return;
        }
      }

      this.selectedRepoTree = [];
      this.selectedRepoPath = "";
      // this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
      // this.reloadImpact()
    },
    repos: {
      handler(val, oldVal) {
        localStorage.repos = JSON.stringify(
          this.repos.map((repo) => {
            return {
              authors: repo.authors,
              commits: repo.commits,
              ignoredFiles: repo.ignoredFiles,
              lines: repo.lines,
              path: repo.path,
            };
          })
        );
      },
      deep: true,
    },
    mainPieData: function () {
      this.isSpinerExtensions = false;
    },
  },
};
</script>
<style scoped>
.project-tree {
  margin: 10px 0;
  max-height: 300px;
  overflow-y: auto;
}
.chart-spiner {
  margin: 0 auto;
  width: 70px;
}
.extensionsChart {
  height: 300px; display: flex;
  align-items: center;
  justify-content: center;
}
</style>