<template>
	<div>
		<div class="container">
			<div class="handle-box">
				<el-input v-model="query.name" placeholder="检索" class="handle-input mr10"></el-input>
				<el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
				<el-button type="primary" :icon="Plus" @click="handleCreate">新增</el-button>
			</div>
			<el-table :data="tableData" border class="table" ref="multipleTable" header-cell-class-name="table-header">
				<el-table-column prop="id" label="ID" width="145" align="center" />
				<el-table-column prop="name" label="任务名称" width="180" />
				<el-table-column prop="expr" label="时间表达式" width="150" />
				<el-table-column prop="mark" label="备注" />
				<el-table-column prop="path" label="脚本路径" min-width="150" />
				<el-table-column label="状态" align="center" width="80">
					<template #default="scope">
						<el-tag v-if="scope.row.enable" type="success">启用</el-tag>
						<el-tag v-else type="danger">停用</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="area" label="参数域" width="120" />
				<el-table-column prop="create_time" label="创建时间" width="190" />
				<el-table-column label="操作" width="380" align="center" fixed="right">
					<template #default="scope">
						<el-button size="mini" :icon="Monitor" class="view-log" type="primary" @click="viewLog(scope.row)">
							查看日志
						</el-button>
						<el-button size="mini" :icon="Close" v-if="scope.row.enable" type="danger"
							@click="modifyStatus(scope.row)" />
						<el-button size="mini" :icon="Check" v-else type="success" @click="modifyStatus(scope.row)" />
						<el-button size="mini" type="primary" :icon="Edit" @click="handleEdit(scope.row)" />
						<el-button size="mini" type="danger" :icon="Delete" @click="handleDelete(scope.row.id)" />
					</template>
				</el-table-column>
			</el-table>
			<div class="pagination">
				<el-pagination background layout="total, prev, pager, next" :current-page="query.pageNum"
					:page-size="query.pageSize" :total="pageTotal" @current-change="handlePageChange"></el-pagination>
			</div>
		</div>

		<!-- 编辑弹出框 -->
		<el-dialog :title="editTitle" top="5px" v-model="editVisible" width="35%" @open="openDialog">
			<el-form label-width="85px">
				<el-form-item label="任务名称">
					<el-input v-model="form.name" />
				</el-form-item>
				<el-form-item label="时间表达式">
					<el-input v-model="form.expr" >
						<template #append>
								<el-popover placement="bottom-end" title="时间表达式" :width="550" :visible="cronVisible">
								<noVue3Cron
									:cron-value="form.expr"
									@change="changeCron"
									@close="cronVisible=false"
									max-height="400px"
									i18n="cn" />
									<template #reference><el-button class="m-2" @click="cronVisible = !cronVisible">设置</el-button></template>
								</el-popover>
						</template>
					</el-input>
				</el-form-item>
				<el-form-item label="脚本路径">
					<el-input v-model="form.path" />
				</el-form-item>
				<el-form-item label="参数域">
					<el-select v-model="form.area_id" placeholder="请选择">
						<el-option v-for="item in areaOpt" :key="item.id" :label="item.name" :value="item.id">
						</el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="备注">
					<el-input v-model="form.mark" type="textarea" />
				</el-form-item>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="editVisible = false">取 消</el-button>
					<el-button type="primary" @click="saveEdit">确 定</el-button>
				</span>
			</template>
		</el-dialog>

		<!-- 日志弹窗 -->
		<el-dialog title="查看日志" top="5px" v-model="logVisible" width="40%"  @close="closeLog">
			<Codemirror v-model:value="code" :options="cmOptions" border :height="400" />
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="job">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Close, Search, Monitor, Plus, Check } from '@element-plus/icons-vue';
import { apiJobCreate, apiListJob, apiDelJob, apiModifyJob, apiModifyStatusJob } from '../../api/job';
import { apiAreaList } from '../../api/param';
import Codemirror, { createLog, createTitle } from "codemirror-editor-vue3"

interface TableItem {
	id: number;
	name: string;
	money: string;
	state: string;
	date: string;
	address: string;
}

const query = reactive({
	address: '',
	name: '',
	pageNum: 1,
	pageSize: 10,
	isNotPaging: true
});
const tableData = ref<TableItem[]>([]);
const pageTotal = ref(0);

const tipLog = "查看任务运行日志";

// websocket 对象
let ws: WebSocket;
// 日志弹窗
const logVisible = ref(false);
// 表格编辑时弹窗和保存
const editVisible = ref(false);
// 弹窗名称
const editTitle = ref('编辑任务');
// 当前弹窗类型 add 添加 modify 修改
const dialogType = ref('add');
// loading
const editLoading = ref(false);
// 参数域的选项
interface AreaItem {
	id: number;
	name: string;
}
// cron 选择器
const cronVisible = ref(false);
const state = reactive({
	cronPopover: false,
	cron: ''
})

// 日志控件配置
const cmOptions = {
	mode: "fclog",
	theme: "default"
}

const code = ref(`${createTitle('脚本运行日志')}`)

const areaOpt = ref<AreaItem[]>([]);

let form = reactive({
	id: '', // 任务ID
	name: '', // 任务名称
	expr: '', // 时间表达式
	mark: '', // 备注
	path: '', // 脚本地址
	enable: false, // 状态
	area: '', // 参数域
	area_id: 10000, // 参数域ID
});

// 当前操作行
let idx: number = -1;

// 获取表格数据
const getData = async () => {
	let { data } = await apiListJob(query)
	if (data.code == 200) {
		tableData.value = data.data;
		pageTotal.value = data.pageInfo.total || 50;
	}
};
getData();

const changeCron = (val: string) => {
	if(typeof(val) !== 'string') return false
	form.expr = val
}

// 在打开弹窗时，调用参数域接口
const openDialog = async (row:any) => {
	// 清空数据
	areaOpt.value.length = 0;

	let req = {
		pageSize: 0,
		pageNum: 0,
	}
	let { data } = await apiAreaList(req)
	console.log("area list", data);

	if (data.code == 200) {
		data.data.forEach((elem: { id: any; name: any; }) => {
			let item: AreaItem = {
				id: elem.id,
				name: elem.name,
			}
			areaOpt.value.push(item);
		});
	}
}

const closeLog = () => {
	logVisible.value = false;
	if (ws) {
		ws.close();
	}
}

// 查看日志
const viewLog = (row: any) => {
	logVisible.value = true;
	code.value = `${createTitle('脚本运行日志')}`;

	if (ws) {
		ws.close();
	}
	// 创建一个websocket 对象
	let url = `ws://${location.host}/socket?name=${row.name}`
	try {
		ws = new WebSocket(url);
		ws.onmessage = (data) => {
			console.log('后台返回数据', data); 
			let logData = JSON.parse(data.data);
			code.value += '\n' + `${createLog(logData.msg, logData.level.toLowerCase())}`; 
		}
	} catch (error) {
		console.error('ws 连接失败', error);
		
	}	
	
};

// 查询操作
const handleSearch = () => {
	query.pageNum = 1;
	getData();
};

// 清空表单
const clearForm = () => {
	// 清空数据
	form.id = ''
	form.name = ''
	form.mark = ''
	form.expr = "* * * * * ?"
	form.enable = false
	form.path = ''
	form.area = ''
	form.area_id = 10000
}

// 表单赋值
const setValueForm = (row: any) => {
	form.id = row.id;
	form.name = row.name;
	form.mark = row.mark;
	form.path = row.path;
	form.expr = row.expr;
	form.enable = row.enable;
	form.area = row.area;
	form.area_id = row.area_id;
}

// 添加任务
const handleCreate = () => {
	dialogType.value = 'add';
	editTitle.value = '添加任务';
	// 清空表单
	clearForm()
	editVisible.value = true;
};

// 修改任务状态
const modifyStatus = async (row: any) => {
	let { data } = await apiModifyStatusJob(row.id);
	if (data.code == 200) {
		if (row.enable) {
			ElMessage.success(`停用任务【${row.name}】成功`)
		} else {
			ElMessage.success(`启用任务【${row.name}】成功`)
		}
	} else {
		ElMessage.error(`修改任务状态失败 ${data.message}`);
	}

	getData();
};

// 修改任务
const handleEdit = (row: any) => {
	editTitle.value = '编辑任务';
	setValueForm(row);
	dialogType.value = 'modify';
	editVisible.value = true;
};

// 分页导航
const handlePageChange = (val: number) => {
	query.pageNum = val;
	getData();
};

// 删除操作
const handleDelete = (index: number) => {
	// 二次确认删除
	ElMessageBox.confirm('确定要删除吗？', '提示', {
		type: 'warning'
	})
		.then(async () => {
			let { data } = await apiDelJob(index)
			if (data.code == 200) {
				ElMessage.success('删除成功');
			}
			// 查询数据
			getData();
		})
		.catch(() => {
			ElMessage.warning('取消删除');
			getData();
		});
};



const saveEdit = async () => {
	try {
		// 调用接口
		// 根据当前类型判断是否应该调用添加还是修改
		// 添加
		if (dialogType.value == 'add') {
			let { data } = await apiJobCreate(form);
			if (data.code == 200) {
				ElMessage.success(`添加任务【${form.name}】成功`);
			} else {
				ElMessage.error(`${data.message}`)
			}
		}
		if (dialogType.value == 'modify') {
			let { data } = await apiModifyJob(form);
			if (data.code == 200) {
				ElMessage.success(`修改任务【${form.name}成功】`)
			} else {
				ElMessage.error(`${data.message}`)
			}
		}
		editVisible.value = false;
	} catch (error) {
		// editLoading.value = false;
		editVisible.value = false;
	}

	// 重新获取数据
	getData();
};
</script>

<style scoped>
.handle-box {
	margin-bottom: 20px;
}

.cron{
	width: 700px;
	margin: 0 auto;
	margin-top: 100px;
}

.view-log {
	margin-right: 5px;
}

.handle-select {
	width: 120px;
}

.handle-input {
	width: 300px;
}

.table {
	width: 100%;
	font-size: 14px;
}

.red {
	color: #F56C6C;
}

.mr10 {
	margin-right: 5px;
}

.table-td-thumb {
	display: block;
	margin: auto;
	width: 40px;
	height: 40px;
}
</style>
