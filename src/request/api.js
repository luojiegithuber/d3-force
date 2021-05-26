/**
 * api接口统一管理
 */
import { get, post } from './http'

export const getDemo = p => get('api/cc/json/mobile_tel_segment.htm?tel=15274903989');

// 扩展节点获取增量图数据
export const getNodeNextJump = (node, relationshipType) => get(`api/getNode?guid=${node.guid}&entity_type=${node.entity_type}&relationship_type=${relationshipType}`);

// 扩展节点获取增量图数据
export const getRelationshipExpandEdge = (link) => get(`api/getEdge?guid=${link.guid}&relationship_type=${link.relationship_type}`);

// 根据案例id获取数据
export const getGraphByCaseId = p => get('api/cc/json/mobile_tel_segment.htm?tel=15274903989');
