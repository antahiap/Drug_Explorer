import axios from 'axios';
import { IAttentionTree, IEdgeTypes, IPath, IState } from 'types';
import { SERVER_URL } from 'Const';

const axiosInstance = axios.create({
  baseURL: `${SERVER_URL}/`,
  // timeout: 1000,
  withCredentials: false,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  },
});

const requestDiseaseUrls = async (): Promise<{ [key: string]: string }> => {
  const url = './txgnn_data/disease_url_map.json';
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestDrugUrls = async (): Promise<{ [key: string]: string }> => {
  const url = './txgnn_data/drug_url_map.json';
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestNodeTypes = async (): Promise<string[]> => {
  const url = './txgnn_data/node_types.json';
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestEdgeTypes = async (): Promise<IEdgeTypes> => {
  const url = './txgnn_data/edge_types.json';
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestNodeNameDict = async () => {
  const url = './txgnn_data/node_name_dict.json';
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestAttention = async (diseaseID: string, drugID: string) => {
  const url = `./api/attention?disease=${diseaseID}&drug=${drugID}`;
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestAttentionPair = async (
  diseaseID: string,
  drugID: string
): Promise<{ attention: { [k: string]: IAttentionTree }; paths: IPath[] }> => {
  const url = `./api/attention_pair?disease=${diseaseID}&drug=${drugID}`;
  let response = await axiosInstance.get(url);
  return response.data;
};

const requestDiseaseOptions = async () => {
  // // // the ranking is too costy
  // const url = './api/diseases';
  // const response = await axiosInstance.get(url);
  // const diseaseOptions: IState['diseaseOptions'] = response.data;

  // const urlRanking = './txgnn_data/disease_ranking.json';
  // let rank = await axiosInstance.get(urlRanking);
  // const ranking = rank.data;

  // diseaseOptions.sort((a, b) => ranking.indexOf(a[0]) - ranking.indexOf(b[0]));
  const urlRanking = './txgnn_data/disease_options.json'; // ranking is too costy, use pre-processed data
  let res = await axiosInstance.get(urlRanking);

  return res.data;
};

const requestDrugPredictions = async (diseaseID: string) => {
  const url = `./api/drug_predictions?disease_id=${diseaseID}`;
  const response = await axiosInstance.get(url);
  const predictions = response.data;
  return predictions;
};

const requestSourceGraphData = async (diseaseID: string, drugID: string) => {
  const url = `./api/source_graph_nodes_data?disease=${diseaseID}&drug=${drugID}`;
  const response = await axiosInstance.get(url);
  return response;
};

const requestEmbedding = async () => {
  const url = './txgnn_data/drug_tsne.json';
  const response = await axiosInstance.get(url);
  return response.data;
};

export {
  requestDiseaseUrls,
  requestDrugUrls,
  requestNodeTypes,
  requestEdgeTypes,
  requestAttention,
  requestNodeNameDict,
  requestDrugPredictions,
  requestDiseaseOptions,
  requestEmbedding,
  requestAttentionPair,
  requestSourceGraphData,
};
