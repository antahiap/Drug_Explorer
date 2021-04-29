# %%
import logging
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable

import pandas as pd
import os

from config import SERVER_ROOT
# %%


class Neo4jApp:

    def __init__(self, is_local):
        self.node_types = [
            "anatomy",
            "biological_process",
            "cellular_component",
            "disease",
            "drug",
            "effect/phenotype",
            "exposure",
            "gene/protein",
            "molecular_function",
            "pathway"
        ]
        self.batch_size = 5000
        # self.data_path = 'https://drug-gnn-models.s3.us-east-2.amazonaws.com/collaboration_delivery/'
        self.data_path = './collab_delivery/'

        if not is_local:
            host_name = "ec2-3-134-76-210.us-east-2.compute.amazonaws.com"
            password = "i-0ecb29664ffd46993"
        else:
            host_name = "localhost"
            password = 'password'

        scheme = "bolt"
        port = 7687
        user = "neo4j"

        # create driver
        uri = "{scheme}://{host_name}:{port}".format(
            scheme=scheme, host_name=host_name, port=port)
        try:
            self.driver = GraphDatabase.driver(
                uri, auth=(user, password), encrypted=False)
        except Exception as e:
            print("Failed to create the driver:", e)

    def close(self):
        if self.driver is not None:
            self.driver.close()

    def clean_database(self):
        with self.driver.session() as session:
            session.run('MATCH (n) DETACH DELETE n')
            print('delete all nodes')

    def create_index(self):

        with self.driver.session() as session:
            for node_type in self.node_types:
                session.run(
                    ' CREATE INDEX IF NOT EXISTS FOR (n: `{}` ) ON (n.id) '.format(node_type))

    def init_database(self):
        self.clean_database()
        self.create_index()
        self.build_attention()
        self.add_prediction()
        print('database initialization finished')

    def build_attention(self):

        attention_path = os.path.join(self.data_path, 'attention_prune.csv')
        attentions = pd.read_csv(attention_path, dtype={
            'x_id': 'string', 'y_id': 'string'})

        lines = []
        x_type = ''
        y_type = ''
        relation = ''

        def get_query(x_type, y_type, relation):
            query = (
                'UNWIND $lines as line '
                'MERGE (node1: `{x_type}` {{ id: line.x_id }}) '
                'ON CREATE SET node1.name = line.x_name '
                'MERGE (node2: `{y_type}` {{ id: line.y_id }}) '
                'ON CREATE SET node2.name = line.y_name  '
                'MERGE (node1)-[e: `{relation}` ]->(node2) '
                'ON CREATE SET e.layer1_att = line.layer1_att, e.layer2_att= line.layer2_att '
            ).format(x_type=x_type,  y_type=y_type, relation=relation)
            return query

        with self.driver.session() as session:
            for idx, row in attentions.iterrows():
                if idx % self.batch_size == 0:
                    if len(lines) > 0:
                        query = get_query(x_type, y_type, relation)
                        session.run(query, lines=lines)
                    x_type = row['x_type']
                    y_type = row['y_type']
                    relation = row['relation']
                    lines = []
                elif row['x_type'] == x_type and row['y_type'] == y_type and relation == relation:

                    lines += [{
                        'x_id': row['x_id'], 'y_id': row['y_id'],
                        'x_name': row['x_name'], 'y_name': row['y_name'],
                        'layer1_att': row['layer1_att'],
                        'layer2_att': row['layer2_att']
                    }]
                else:
                    query = get_query(x_type, y_type, relation)
                    session.run(query, lines=lines)
                    x_type = row['x_type']
                    y_type = row['y_type']
                    relation = row['relation']
                    lines = []
            query = get_query(x_type, y_type, relation)
            session.run(query, lines=lines)

    def add_prediction(self):
        prediction = pd.read_pickle(os.path.join(
            data_path, 'result.pkl'))['prediction']

        query = (
            'UNWIND $lines as line '
            'MATCH (node1: disease { id: line.x_id }) '
            'MATCH (node2: drug { id: line.y_id }) '
            'CREATE (node1)-[: Prediction { score: line.score, relation: rev_indication } ]->(node2) '
            'RETURN node1, node2'
        )
        lines = []

        with self.driver.session() as session:
            for disease in prediction["rev_indication"]:
                drugs = prediction["rev_indication"][disease]
                top_drugs = sorted(
                    drugs.items(), key=lambda item: item[1], reverse=True
                )[:20]
                if len(lines) >= self.batch_size:
                    session.run(query, lines=lines)
                    lines = []
                else:
                    lines += [
                        {'x_id': disease, 'y_id': item[0], 'score':item[1]} for item in top_drugs
                    ]
            session.run(query, lines=lines)


# %%
if __name__ == "__main__":
    is_local = False

    app = Neo4jApp(is_local=is_local)

    app.init_database()
    app.close()

# %%