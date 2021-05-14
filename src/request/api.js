/**
 * api接口统一管理
 */
import { get, post } from './http'

export const getDemo = p => get('api/cc/json/mobile_tel_segment.htm?tel=15274903989');

// 扩展节点获取增量图数据
export const getNodeNextJump = p => get('api/cc/json/mobile_tel_segment.htm?tel=15274903989');

// 根据案例id获取数据
export const getGraphByCaseId = p => get('api/cc/json/mobile_tel_segment.htm?tel=15274903989');
