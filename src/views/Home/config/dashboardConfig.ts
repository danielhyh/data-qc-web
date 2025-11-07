import type { Component } from 'vue'
import {
  Upload,
  Document,
  FolderAdd,
  DataLine,
  CircleCheck,
  Compass,
  Setting,
  UserFilled,
  OfficeBuilding,
  Bell,
  TrendCharts,
  Files,
  Monitor,
  Edit,
  Management,
  Calendar,
  PieChart
} from '@element-plus/icons-vue'

// 角色枚举
export enum UserRole {
  INSTITUTION_ADMIN = 'institution_admin',     // 机构管理员
  CITY_ADMIN = 'city_admin',                   // 市管理员
  COUNTY_ADMIN = 'county_admin',               // 县管理员
  PROVINCE_ADMIN = 'province_admin'            // 省管理员
}

// 系统类型
export interface SystemInfo {
  key: string
  name: string
  description: string
  icon: Component
  color: string
  entries: SystemEntry[]
}

// 系统入口
export interface SystemEntry {
  key: string
  name: string
  path: string
  icon: Component
  description: string
  permission?: string
}

// 快捷操作
export interface QuickAction {
  key: string
  name: string
  description: string
  icon: Component
  color: string
  path?: string
  action?: () => void
}

// 统计数据配置
export interface StatisticConfig {
  key: string
  title: string
  icon: Component
  color: string
  suffix?: string
  description: string
}

// 仪表板配置
export interface DashboardConfig {
  title: string
  description: string
  statistics: StatisticConfig[]
  systems: SystemInfo[]
  quickActions: QuickAction[]
}

// 角色配置映射
const roleConfigs: Record<UserRole, DashboardConfig> = {
  // 机构管理员配置
  [UserRole.INSTITUTION_ADMIN]: {
    title: '陕西省药品使用监测管理系统',
    description: '医疗机构药品数据上报和质量管控中心',
    statistics: [
      {
        key: 'todayTasks',
        title: '今日任务',
        icon: FolderAdd,
        color: '#409EFF',
        description: '待处理上报任务'
      },
      {
        key: 'completedTasks',
        title: '已完成',
        icon: CircleCheck,
        color: '#67C23A',
        description: '本月完成任务'
      },
      {
        key: 'pendingReview',
        title: '待审核',
        icon: Document,
        color: '#E6A23C',
        description: '待上级审核'
      },
      {
        key: 'dataQuality',
        title: '数据质量',
        icon: Compass,
        color: '#909399',
        suffix: '%',
        description: '数据完整性评分'
      }
    ],
    systems: [
      {
        key: 'drugMonitoring',
        name: '药品监测',
        description: '药品使用数据上报和YPID标准化比对',
        icon: Monitor,
        color: '#409EFF',
        entries: [
          {
            key: 'dataUpload',
            name: '数据上报',
            path: '/drug/data-upload',
            icon: Upload,
            description: '上传药品使用数据'
          },
          {
            key: 'ypidMatch',
            name: 'YPID比对',
            path: '/drug/ypid-match',
            icon: DataLine,
            description: '药品编码标准化比对'
          }
        ]
      },
      {
        key: 'seasonalMonitoring',
        name: '季节性药品监测周报',
        description: '季节性药品使用情况周报填报',
        icon: Calendar,
        color: '#67C23A',
        entries: [
          {
            key: 'weeklyReport',
            name: '周报填报',
            path: '/seasonal/weekly-report',
            icon: Edit,
            description: '填报季节性药品使用周报'
          },
          {
            key: 'reportHistory',
            name: '填报历史',
            path: '/seasonal/report-history',
            icon: Files,
            description: '查看历史填报记录'
          }
        ]
      }
    ],
    quickActions: [
      {
        key: 'quickUpload',
        name: '快速上报',
        description: '一键上传数据',
        icon: Upload,
        color: '#409EFF',
        path: '/drug/quick-upload'
      },
      {
        key: 'messageCenter',
        name: '消息中心',
        description: '查看系统通知',
        icon: Bell,
        color: '#E6A23C',
        path: '/message/center'
      },
      {
        key: 'helpDoc',
        name: '帮助文档',
        description: '操作指南',
        icon: Document,
        color: '#909399',
        path: '/help/docs'
      }
    ]
  },

  // 市/县管理员配置
  [UserRole.CITY_ADMIN]: {
    title: '药品监测管理平台',
    description: '市级药品数据质控和任务管理中心',
    statistics: [
      {
        key: 'totalInstitutions',
        title: '管辖机构',
        icon: OfficeBuilding,
        color: '#409EFF',
        description: '总管辖医疗机构数'
      },
      {
        key: 'todayTasks',
        title: '今日任务',
        icon: FolderAdd,
        color: '#67C23A',
        description: '今日待处理任务'
      },
      {
        key: 'dataQuality',
        title: '质控通过率',
        icon: CircleCheck,
        color: '#E6A23C',
        suffix: '%',
        description: '质控规则通过率'
      },
      {
        key: 'completionRate',
        title: '填报完成率',
        icon: TrendCharts,
        color: '#909399',
        suffix: '%',
        description: '机构填报完成率'
      }
    ],
    systems: [
      {
        key: 'drugMonitoring',
        name: '药品监测',
        description: '药品数据管理和质量控制',
        icon: Monitor,
        color: '#409EFF',
        entries: [
          {
            key: 'templateManage',
            name: '导入模版管理',
            path: '/drug/template-manage',
            icon: Files,
            description: '管理数据导入模版'
          },
          {
            key: 'taskManage',
            name: '任务管理',
            path: '/drug/task-manage',
            icon: Management,
            description: '填报任务管理'
          },
          {
            key: 'dataManage',
            name: '数据管理',
            path: '/drug/data-manage',
            icon: DataLine,
            description: '药品数据管理'
          },
          {
            key: 'qcManage',
            name: '质控管理',
            path: '/drug/qc-manage',
            icon: CircleCheck,
            description: '质控规则管理'
          },
          {
            key: 'standardLibrary',
            name: '标准库管理',
            path: '/drug/standard-library',
            icon: Files,
            description: '药品标准库管理'
          },
          {
            key: 'statistics',
            name: '数据统计分析',
            path: '/drug/statistics',
            icon: PieChart,
            description: '国家数据统计分析'
          }
        ]
      },
      {
        key: 'seasonalMonitoring',
        name: '季节性药品监测周报',
        description: '季节性药品监测管理',
        icon: Calendar,
        color: '#67C23A',
        entries: [
          {
            key: 'reportZoneManage',
            name: '填报专区管理',
            path: '/seasonal/report-zone',
            icon: Management,
            description: '管理填报专区'
          },
          {
            key: 'reportRecordManage',
            name: '填报记录管理',
            path: '/seasonal/record-manage',
            icon: Files,
            description: '管理填报记录'
          },
          {
            key: 'weeklyStatistics',
            name: '周报统计分析',
            path: '/seasonal/statistics',
            icon: TrendCharts,
            description: '周报数据统计分析'
          }
        ]
      }
    ],
    quickActions: [
      {
        key: 'taskAssign',
        name: '任务分配',
        description: '分配填报任务',
        icon: Management,
        color: '#409EFF',
        path: '/task/assign'
      },
      {
        key: 'qualityCheck',
        name: '质控检查',
        description: '执行质控规则',
        icon: CircleCheck,
        color: '#67C23A',
        path: '/qc/check'
      },
      {
        key: 'dataAnalysis',
        name: '数据分析',
        description: '生成分析报告',
        icon: TrendCharts,
        color: '#E6A23C',
        path: '/analysis/report'
      },
      {
        key: 'messageCenter',
        name: '消息中心',
        description: '通知消息管理',
        icon: Bell,
        color: '#909399',
        path: '/message/center'
      }
    ]
  },

  // 县管理员配置（与市管理员相同）
  [UserRole.COUNTY_ADMIN]: {
    title: '药品监测管理平台',
    description: '县级药品数据质控和任务管理中心',
    statistics: [
      {
        key: 'totalInstitutions',
        title: '管辖机构',
        icon: OfficeBuilding,
        color: '#409EFF',
        description: '总管辖医疗机构数'
      },
      {
        key: 'todayTasks',
        title: '今日任务',
        icon: FolderAdd,
        color: '#67C23A',
        description: '今日待处理任务'
      },
      {
        key: 'dataQuality',
        title: '质控通过率',
        icon: CircleCheck,
        color: '#E6A23C',
        suffix: '%',
        description: '质控规则通过率'
      },
      {
        key: 'completionRate',
        title: '填报完成率',
        icon: TrendCharts,
        color: '#909399',
        suffix: '%',
        description: '机构填报完成率'
      }
    ],
    systems: [
      {
        key: 'drugMonitoring',
        name: '药品监测',
        description: '药品数据管理和质量控制',
        icon: Monitor,
        color: '#409EFF',
        entries: [
          {
            key: 'templateManage',
            name: '导入模版管理',
            path: '/drug/template-manage',
            icon: Files,
            description: '管理数据导入模版'
          },
          {
            key: 'taskManage',
            name: '任务管理',
            path: '/drug/task-manage',
            icon: Management,
            description: '填报任务管理'
          },
          {
            key: 'dataManage',
            name: '数据管理',
            path: '/drug/data-manage',
            icon: DataLine,
            description: '药品数据管理'
          },
          {
            key: 'qcManage',
            name: '质控管理',
            path: '/drug/qc-manage',
            icon: CircleCheck,
            description: '质控规则管理'
          },
          {
            key: 'standardLibrary',
            name: '标准库管理',
            path: '/drug/standard-library',
            icon: Files,
            description: '药品标准库管理'
          },
          {
            key: 'statistics',
            name: '数据统计分析',
            path: '/drug/statistics',
            icon: PieChart,
            description: '国家数据统计分析'
          }
        ]
      },
      {
        key: 'seasonalMonitoring',
        name: '季节性药品监测周报',
        description: '季节性药品监测管理',
        icon: Calendar,
        color: '#67C23A',
        entries: [
          {
            key: 'reportZoneManage',
            name: '填报专区管理',
            path: '/seasonal/report-zone',
            icon: Management,
            description: '管理填报专区'
          },
          {
            key: 'reportRecordManage',
            name: '填报记录管理',
            path: '/seasonal/record-manage',
            icon: Files,
            description: '管理填报记录'
          },
          {
            key: 'weeklyStatistics',
            name: '周报统计分析',
            path: '/seasonal/statistics',
            icon: TrendCharts,
            description: '周报数据统计分析'
          }
        ]
      }
    ],
    quickActions: [
      {
        key: 'taskAssign',
        name: '任务分配',
        description: '分配填报任务',
        icon: Management,
        color: '#409EFF',
        path: '/task/assign'
      },
      {
        key: 'qualityCheck',
        name: '质控检查',
        description: '执行质控规则',
        icon: CircleCheck,
        color: '#67C23A',
        path: '/qc/check'
      },
      {
        key: 'dataAnalysis',
        name: '数据分析',
        description: '生成分析报告',
        icon: TrendCharts,
        color: '#E6A23C',
        path: '/analysis/report'
      },
      {
        key: 'messageCenter',
        name: '消息中心',
        description: '通知消息管理',
        icon: Bell,
        color: '#909399',
        path: '/message/center'
      }
    ]
  },

  // 省管理员配置
  [UserRole.PROVINCE_ADMIN]: {
    title: '药品监测管理平台',
    description: '省级药品数据管控和系统管理中心',
    statistics: [
      {
        key: 'totalCities',
        title: '管辖市区',
        icon: OfficeBuilding,
        color: '#409EFF',
        description: '省内市区总数'
      },
      {
        key: 'totalInstitutions',
        title: '医疗机构',
        icon: OfficeBuilding,
        color: '#67C23A',
        description: '省内医疗机构总数'
      },
      {
        key: 'dataQuality',
        title: '质控通过率',
        icon: CircleCheck,
        color: '#E6A23C',
        suffix: '%',
        description: '全省质控通过率'
      },
      {
        key: 'systemHealth',
        title: '系统健康度',
        icon: TrendCharts,
        color: '#909399',
        suffix: '%',
        description: '系统运行健康度'
      }
    ],
    systems: [
      {
        key: 'drugMonitoring',
        name: '药品监测',
        description: '省级药品数据管理和质量控制',
        icon: Monitor,
        color: '#409EFF',
        entries: [
          {
            key: 'templateManage',
            name: '导入模版管理',
            path: '/drug/template-manage',
            icon: Files,
            description: '管理数据导入模版'
          },
          {
            key: 'taskManage',
            name: '任务管理',
            path: '/drug/task-manage',
            icon: Management,
            description: '填报任务管理'
          },
          {
            key: 'dataManage',
            name: '数据管理',
            path: '/drug/data-manage',
            icon: DataLine,
            description: '药品数据管理'
          },
          {
            key: 'qcManage',
            name: '质控管理',
            path: '/drug/qc-manage',
            icon: CircleCheck,
            description: '质控规则管理'
          },
          {
            key: 'standardLibrary',
            name: '标准库管理',
            path: '/drug/standard-library',
            icon: Files,
            description: '药品标准库管理'
          },
          {
            key: 'statistics',
            name: '数据统计分析',
            path: '/drug/statistics',
            icon: PieChart,
            description: '国家数据统计分析'
          }
        ]
      },
      {
        key: 'seasonalMonitoring',
        name: '季节性药品监测周报',
        description: '省级季节性药品监测管理',
        icon: Calendar,
        color: '#67C23A',
        entries: [
          {
            key: 'reportZoneManage',
            name: '填报专区管理',
            path: '/seasonal/report-zone',
            icon: Management,
            description: '管理填报专区'
          },
          {
            key: 'reportRecordManage',
            name: '填报记录管理',
            path: '/seasonal/record-manage',
            icon: Files,
            description: '管理填报记录'
          },
          {
            key: 'weeklyStatistics',
            name: '周报统计分析',
            path: '/seasonal/statistics',
            icon: TrendCharts,
            description: '周报数据统计分析'
          }
        ]
      },
      {
        key: 'systemManage',
        name: '系统管理',
        description: '用户权限和系统配置管理',
        icon: Setting,
        color: '#F56C6C',
        entries: [
          {
            key: 'regionManage',
            name: '地区管理',
            path: '/system/region-manage',
            icon: OfficeBuilding,
            description: '管理行政地区'
          },
          {
            key: 'userManage',
            name: '用户管理',
            path: '/system/user-manage',
            icon: UserFilled,
            description: '管理系统用户'
          },
          {
            key: 'roleManage',
            name: '角色管理',
            path: '/system/role-manage',
            icon: Management,
            description: '管理用户角色'
          },
          {
            key: 'institutionManage',
            name: '机构管理',
            path: '/system/institution-manage',
            icon: OfficeBuilding,
            description: '管理医疗机构'
          },
          {
            key: 'messageManage',
            name: '消息中心',
            path: '/system/message-manage',
            icon: Bell,
            description: '消息管理系统'
          }
        ]
      }
    ],
    quickActions: [
      {
        key: 'systemMonitor',
        name: '系统监控',
        description: '系统运行状态',
        icon: Monitor,
        color: '#409EFF',
        path: '/system/monitor'
      },
      {
        key: 'userManage',
        name: '用户管理',
        description: '管理系统用户',
        icon: UserFilled,
        color: '#67C23A',
        path: '/system/user'
      },
      {
        key: 'dataAnalysis',
        name: '数据分析',
        description: '省级数据分析',
        icon: TrendCharts,
        color: '#E6A23C',
        path: '/analysis/province'
      },
      {
        key: 'systemConfig',
        name: '系统配置',
        description: '系统参数配置',
        icon: Setting,
        color: '#909399',
        path: '/system/config'
      }
    ]
  }
}

/**
 * 根据用户角色获取仪表板配置
 * @param roles 用户角色数组
 * @returns 仪表板配置
 */
export function getDashboardConfig(roles: string[]): DashboardConfig {
  // 角色优先级：省 > 市 > 县 > 机构
  const rolePriority = [
    UserRole.PROVINCE_ADMIN,
    UserRole.CITY_ADMIN,
    UserRole.COUNTY_ADMIN,
    UserRole.INSTITUTION_ADMIN
  ]

  // 找到用户拥有的最高权限角色
  const userRole = rolePriority.find(role => roles.includes(role))

  // 如果没有匹配的角色，默认使用机构管理员配置
  return roleConfigs[userRole || UserRole.INSTITUTION_ADMIN]
}

/**
 * 检查用户是否具有指定角色
 * @param roles 用户角色数组
 * @param targetRole 目标角色
 * @returns 是否具有指定角色
 */
export function hasRole(roles: string[], targetRole: UserRole): boolean {
  return roles.includes(targetRole)
}

/**
 * 获取用户的最高权限角色
 * @param roles 用户角色数组
 * @returns 最高权限角色
 */
export function getHighestRole(roles: string[]): UserRole {
  const rolePriority = [
    UserRole.PROVINCE_ADMIN,
    UserRole.CITY_ADMIN,
    UserRole.COUNTY_ADMIN,
    UserRole.INSTITUTION_ADMIN
  ]

  return rolePriority.find(role => roles.includes(role)) || UserRole.INSTITUTION_ADMIN
}
