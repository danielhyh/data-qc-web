import request from '@/config/axios'

// 医疗机构基本情况--历史 VO
export interface HistoryHospitalVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  uploadDate: string // 数据上报日期
  domainCode: string // 省级行政区划代码（2位）
  organizationCode: string // 组织机构代码（9位）
  hospitalCode: string // 医疗机构代码（22位）
  organizationName: string // 组织机构名称
  unitManager: string // 单位负责人
  statisticsManager: string // 统计负责人
  bedCount: number // 实有床位数
  doctorCount: number // 执业医师数
  assistantDoctorCount: number // 执业助理医师数
  visitCount: number // 总诊疗人次数
  dischargeCount: number // 出院人数
  annualDrugIncomeImport: number // 年度药品总收入-导入
  annualDrugIncomeSync: number // 年度药品总收入-直报系统同步
  ypPurchaseAmount: number // 中药饮片总采购额
  ypSellAmount: number // 中药饮片总销售额
  klPurchaseAmount: number // 中药颗粒剂总采购额
  klSellAmount: number // 中药颗粒剂总销售额
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  deptId: number // 部门id
  reportOrgLevel: number // 报告机构等级
  reportOrgName: string // 报告机构名称
  reportYear: number // 报告年份
  reportProvince: string // 报告省份
  reportCity: string // 报告市
  reportDistrict: string // 报告区县
}

// 医疗机构基本情况--历史 API
export const HistoryHospitalApi = {
  // 查询医疗机构基本情况--历史分页
  getHistoryHospitalPage: async (params: any) => {
    return await request.get({ url: `/drug/history-hospital/page`, params })
  },

  // 查询医疗机构基本情况--历史详情
  getHistoryHospital: async (id: number) => {
    return await request.get({ url: `/drug/history-hospital/get?id=` + id })
  },

  // 新增医疗机构基本情况--历史
  createHistoryHospital: async (data: HistoryHospitalVO) => {
    return await request.post({ url: `/drug/history-hospital/create`, data })
  },

  // 修改医疗机构基本情况--历史
  updateHistoryHospital: async (data: HistoryHospitalVO) => {
    return await request.put({ url: `/drug/history-hospital/update`, data })
  },

  // 删除医疗机构基本情况--历史
  deleteHistoryHospital: async (id: number) => {
    return await request.delete({ url: `/drug/history-hospital/delete?id=` + id })
  },

  // 导出医疗机构基本情况--历史 Excel
  exportHistoryHospital: async (params) => {
    return await request.download({ url: `/drug/history-hospital/export-excel`, params })
  },
}