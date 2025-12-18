import { Layout } from '@/utils/routerHelper'

const { t } = useI18n()
/**
 * redirect: noredirect        当设置 noredirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'          设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * meta : {
 hidden: true              当设置 true 的时候该路由不会再侧边栏出现 如404，login等页面(默认 false)

 alwaysShow: true          当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式，
 只有一个时，会将那个子路由当做根路由显示在侧边栏，
 若你想不管路由下面的 children 声明的个数都显示你的根路由，
 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，
 一直显示根路由(默认 false)

 title: 'title'            设置该路由在侧边栏和面包屑中展示的名字

 icon: 'svg-name'          设置该路由的图标

 noCache: true             如果设置为true，则不会被 <keep-alive> 缓存(默认 false)

 breadcrumb: false         如果设置为false，则不会在breadcrumb面包屑中显示(默认 true)

 affix: true               如果设置为true，则会一直固定在tag项中(默认 false)

 noTagsView: true          如果设置为true，则不会出现在tag中(默认 false)

 activeMenu: '/dashboard'  显示高亮的路由路径

 followAuth: '/dashboard'  跟随哪个路由进行权限过滤

 canTo: true               设置为true即使hidden为true，也依然可以进行路由跳转(默认 false)
 }
 **/
const remainingRouter: AppRouteRecordRaw[] = [
  {
    path: '/feedback',
    component: Layout,
    name: 'Feedback',
    meta: {
      title: '反馈管理',
      icon: 'ep:ticket',
      alwaysShow: true
    },
    children: [
      {
        path: 'list',
        name: 'FeedbackList',
        component: () => import('@/views/drug/feedback/index.vue'),
        meta: {
          title: '反馈列表'
        }
      },
      {
        path: 'detail/:id',
        name: 'FeedbackDetail',
        component: () => import('@/views/drug/feedback/detail.vue'),
        meta: {
          title: '反馈详情',
          hidden: true,
          canTo: true,
          activeMenu: '/feedback/list'
        }
      }
    ]
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'Redirect',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    name: 'Home',
    meta: {},
    children: [
      {
        path: 'home',
        component: () => import('@/views/Home/Index.vue'),
        name: 'Workspace',
        meta: {
          title: t('router.home'),
          icon: 'ep:home-filled',
          noCache: false,
          affix: true
        }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    name: 'UserInfo',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'profile',
        component: () => import('@/views/Profile/Index.vue'),
        name: 'Profile',
        meta: {
          canTo: true,
          hidden: true,
          noTagsView: false,
          icon: 'ep:user',
          title: t('common.profile')
        }
      },
      {
        path: 'notify-message',
        component: () => import('@/views/system/notify/my/index.vue'),
        name: 'MyNotifyMessage',
        meta: {
          canTo: true,
          hidden: true,
          noTagsView: false,
          icon: 'ep:message',
          title: '我的站内信'
        }
      },
      {
        path: 'my-notice',
        component: () => import('@/views/system/notice/my/index.vue'),
        name: 'MyNotice',
        meta: {
          canTo: true,
          hidden: true,
          noTagsView: false,
          icon: 'ep:bell',
          title: '我的公告'
        }
      }
    ]
  },
  {
    path: '/complete-profile',
    component: () => import('@/views/Profile/CompleteProfile.vue'),
    name: 'CompleteProfile',
    meta: {
      hidden: true,
      title: '完善账户信息',
      noTagsView: true,
      canTo: true
    }
  },
  {
    path: '/dict',
    component: Layout,
    name: 'dict',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'type/data/:dictType',
        component: () => import('@/views/system/dict/data/index.vue'),
        name: 'SystemDictData',
        meta: {
          title: '字典数据',
          noCache: true,
          hidden: true,
          canTo: true,
          icon: '',
          activeMenu: '/system/dict'
        }
      }
    ]
  },

  {
    path: '/codegen',
    component: Layout,
    name: 'CodegenEdit',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'edit',
        component: () => import('@/views/infra/codegen/EditTable.vue'),
        name: 'InfraCodegenEditTable',
        meta: {
          noCache: true,
          hidden: true,
          canTo: true,
          icon: 'ep:edit',
          title: '修改生成配置',
          activeMenu: 'infra/codegen/index'
        }
      }
    ]
  },
  {
    path: '/job',
    component: Layout,
    name: 'JobL',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'job-log',
        component: () => import('@/views/infra/job/logger/index.vue'),
        name: 'InfraJobLog',
        meta: {
          noCache: true,
          hidden: true,
          canTo: true,
          icon: 'ep:edit',
          title: '调度日志',
          activeMenu: 'infra/job/index'
        }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/sso',
    component: () => import('@/views/Login/Login.vue'),
    name: 'SSOLogin',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/social-login',
    component: () => import('@/views/Login/SocialLogin.vue'),
    name: 'SocialLogin',
    meta: {
      hidden: true,
      title: t('router.socialLogin'),
      noTagsView: true
    }
  },
  {
    path: '/403',
    component: () => import('@/views/Error/403.vue'),
    name: 'NoAccess',
    meta: {
      hidden: true,
      title: '403',
      noTagsView: true
    }
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFound',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  },
  {
    path: '/500',
    component: () => import('@/views/Error/500.vue'),
    name: 'Error',
    meta: {
      hidden: true,
      title: '500',
      noTagsView: true
    }
  },
  {
    path: '/ai',
    component: Layout,
    name: 'Ai',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'image/square',
        component: () => import('@/views/ai/image/square/index.vue'),
        name: 'AiImageSquare',
        meta: {
          title: '绘图作品',
          icon: 'ep:home-filled',
          noCache: false
        }
      },
      {
        path: 'knowledge/document',
        component: () => import('@/views/ai/knowledge/document/index.vue'),
        name: 'AiKnowledgeDocument',
        meta: {
          title: '知识库文档',
          icon: 'ep:document',
          noCache: false,
          activeMenu: '/ai/knowledge'
        }
      },
      {
        path: 'knowledge/document/create',
        component: () => import('@/views/ai/knowledge/document/form/index.vue'),
        name: 'AiKnowledgeDocumentCreate',
        meta: {
          title: '创建文档',
          icon: 'ep:plus',
          noCache: true,
          hidden: true,
          activeMenu: '/ai/knowledge'
        }
      },
      {
        path: 'knowledge/document/update',
        component: () => import('@/views/ai/knowledge/document/form/index.vue'),
        name: 'AiKnowledgeDocumentUpdate',
        meta: {
          title: '修改文档',
          icon: 'ep:edit',
          noCache: true,
          hidden: true,
          activeMenu: '/ai/knowledge'
        }
      },
      {
        path: 'knowledge/retrieval',
        component: () => import('@/views/ai/knowledge/knowledge/retrieval/index.vue'),
        name: 'AiKnowledgeRetrieval',
        meta: {
          title: '文档召回测试',
          icon: 'ep:search',
          noCache: true,
          hidden: true,
          activeMenu: '/ai/knowledge'
        }
      },
      {
        path: 'knowledge/segment',
        component: () => import('@/views/ai/knowledge/segment/index.vue'),
        name: 'AiKnowledgeSegment',
        meta: {
          title: '知识库分段',
          icon: 'ep:tickets',
          noCache: true,
          hidden: true,
          activeMenu: '/ai/knowledge'
        }
      },
      {
        path: 'console/workflow/create',
        component: () => import('@/views/ai/workflow/form/index.vue'),
        name: 'AiWorkflowCreate',
        meta: {
          noCache: true,
          hidden: true,
          canTo: true,
          title: '设计 AI 工作流',
          activeMenu: '/ai/console/workflow'
        }
      },
      {
        path: 'console/workflow/:type/:id',
        component: () => import('@/views/ai/workflow/form/index.vue'),
        name: 'AiWorkflowUpdate',
        meta: {
          noCache: true,
          hidden: true,
          canTo: true,
          title: '设计 AI 工作流',
          activeMenu: '/ai/console/workflow'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/Error/404.vue'),
    name: '',
    meta: {
      title: '404',
      hidden: true,
      breadcrumb: false
    }
  },
  {
    path: '/drug-import',
    component: Layout,
    name: 'DrugImportCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'batch',
        name: 'DrugImportBatch',
        component: () => import('@/views/drug/import/batch/index.vue'),
        meta: {
          title: '批量导入',
          icon: 'ep:files',
          noCache: false,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'detail/:id',
        name: 'DrugImportTaskDetail',
        component: () => import('@/views/drug/import/detail/index.vue'),
        meta: {
          title: '任务详情',
          icon: 'ep:view',
          noCache: false,
          hidden: true,
          canTo: true,
          breadcrumb: true
        }
      },
      {
        path: 'report-submission',
        name: 'DrugReportSubmission',
        component: () => import('@/views/drug/report/submission/index.vue'),
        meta: {
          title: '数据上报',
          icon: 'ep:upload',
          noCache: false,
          canTo: true,
          hidden: false
        }
      },
      {
        path: 'report-data',
        name: 'DrugReportData',
        component: () => import('@/views/drug/report/submission/ReportData.vue'),
        meta: {
          title: '上报数据',
          icon: 'ep:view',
          noCache: false,
          canTo: true,
          hidden: false
        }
      },
      {
        path: 'report-view-data',
        name: 'DrugReportViewData',
        component: () => import('@/views/drug/report/submission/DrugReportViewData.vue'),
        meta: {
          title: '查看数据',
          icon: 'ep:view',
          noCache: false,
          canTo: true,
          hidden: false
        }
      },
      {
        path: 'monitor/:id',
        name: 'DrugImportMonitor',
        component: () => import('@/views/drug/import/monitor/index.vue'),
        meta: {
          title: '进度监控',
          icon: 'ep:monitor',
          noCache: true,
          hidden: true,
          canTo: true,
          breadcrumb: true
        }
      }
    ]
  },
  {
    path: '/drug-qc',
    component: Layout,
    name: 'DrugQcCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'rule/builder/:id?',
        name: 'QcRuleBuilder',
        component: () => import('@/views/drug/qc/rule/builder/index.vue'),
        meta: {
          title: '质控规则构建器',
          icon: 'ep:cpu',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/drug/qc/rule'
        }
      }
    ]
  },
  {
    path: '/drug/ypid',
    component: Layout,
    name: 'DrugYpidCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'batch-match',
        name: 'DrugYpidBatchMatch',
        component: () => import('@/views/drug/ypid/batch-match/index.vue'),
        meta: {
          title: '批量匹配',
          icon: 'ep:operation',
          noCache: true,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'manual-match',
        name: 'DrugYpidManualMatch',
        component: () => import('@/views/drug/ypid/manual-match/index.vue'),
        meta: {
          title: '手动匹配',
          icon: 'ep:edit',
          noCache: true,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'report',
        name: 'DrugYpidReport',
        component: () => import('@/views/drug/ypid/report/index.vue'),
        meta: {
          title: '匹配报告',
          icon: 'ep:document',
          noCache: true,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'report/detail/:reportId',
        name: 'DrugYpidReportDetail',
        component: () => import('@/views/drug/ypid/report/detail.vue'),
        meta: {
          title: '报告详情',
          icon: 'ep:view',
          noCache: true,
          canTo: true,
          hidden: true
        }
      }
    ]
  },
  {
    path: '/drug/ypidcompare',
    component: Layout,
    name: 'DrugYpidCompareCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'standard-library',
        name: 'DrugYpidStandardLibrary',
        component: () => import('@/views/drug/ypidcompare/standardLibrary/index.vue'),
        meta: {
          title: '标准库',
          icon: 'ep:folder-opened',
          noCache: true,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'batch-match',
        name: 'DrugYpidBatchMatch',
        component: () => import('@/views/drug/ypidcompare/batchMatch/index.vue'),
        meta: {
          title: '批量匹配',
          icon: 'ep:operation',
          noCache: true,
          canTo: true,
          hidden: true
        }
      },
      {
        path: 'report-detail/:reportId',
        name: 'DrugYpidReportDetail',
        component: () => import('@/views/drug/ypidcompare/reportDetail/detail.vue'),
        meta: {
          title: '查看报告',
          icon: 'ep:document',
          noCache: true,
          canTo: true,
          hidden: true
        }
      }
    ]
  },
    {
    path: '/drug/statistics',
    component: Layout,
    name: 'DrugStatisticsCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'progress',
        name: 'DrugStatisticsProgress',
        component: () => import('@/views/drug/statistics/progress/index.vue'),
        meta: {
          title: '机构填报进度统计',
          icon: 'ep:data-line',
          noCache: false,
          canTo: true,
          hidden: true
        }
      }
    ]
  },
  {
    path: '/drug/qc-result',
    component: Layout,
    name: 'DrugQcResultCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'detail/:id',
        name: 'QcResultDetail',
        component: () => import('@/views/drug/qc/result/detail.vue'),
        meta: {
          title: '质控结果详情',
          icon: 'ep:view',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/drug/qc-result'
        }
      }
    ]
  },
  {
    path: '/shortage',
    component: Layout,
    name: 'ShortageCenter',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'drug-config',
        name: 'ShortageDrugConfig',
        component: () => import('@/views/shortage/drugconfig/index.vue'),
        meta: {
          title: '专区药品配置',
          icon: 'ep:setting',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/shortage/report-zone'
        }
      },
      {
        path: 'report-record',
        name: 'ShortageReportRecord',
        component: () => import('@/views/shortage/reportrecord/index.vue'),
        meta: {
          title: '填报记录',
          icon: 'ep:document',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/shortage/report-period'  // 高亮周期管理菜单
        }
      },
      {
        path: 'report-view/:taskId',
        name: 'ShortageReportView',
        component: () => import('@/views/shortage/reportrecord/components/Report.vue'),
        meta: {
          title: '填报记录查看',
          icon: 'ep:view',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/shortage/report-period'
        }
      }
    ]
  },
  {
    path: '/shortage-report',
    component: Layout,
    name: 'ShortageReport',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'report/:taskId',
        name: 'ShortageReport',
        component: () => import('@/views/shortage/report/components/Report.vue'),
        meta: {
          title: '药品短缺填报',
          icon: 'ep:edit',
          noCache: true,
          canTo: true,
          hidden: true,
          activeMenu: '/shortage/report'
        }
      }
    ]
  }
]

export default remainingRouter
