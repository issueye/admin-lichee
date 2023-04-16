import request from '../utils/request';

// apiJobCreate
// 创建用户任务
export const apiJobCreate = (data: any) => {
    return request({
        url: 'api/job',
        method: 'post',
        data: data,
    });
}

// apiJobList
// 获取任务列表
export const apiListJob = (params: any) => {
    return request({
        url: 'api/job',
        method: 'get',
        params: params
    });
}

// apiDelJob
// 删除任务
export const apiDelJob = (id: number) => {
    return request({
        url: `api/job/${id}`,
        method: 'delete',
    });
}

// apiDelJob
// 删除任务
export const apiModifyJob = (data: any) => {
    return request({
        url: `api/job`,
        method: 'put',
        data: data
    });
}

// apiModifyStatusJob
// 删除任务
export const apiModifyStatusJob = (id: string) => {
    return request({
        url: `api/job/status/${id}`,
        method: 'put',
    });
}