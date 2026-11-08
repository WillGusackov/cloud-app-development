import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
// Initialization
const ddbDocClient = createDDbDocClient();
// Handler
export const handler: Handler = async () => {
  try {
    let commandOutput = await ddbDocClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );
    const items = [...(commandOutput.Items ?? [])];

    while (commandOutput.LastEvaluatedKey) {
      commandOutput = await ddbDocClient.send(
        new ScanCommand({
          TableName: process.env.TABLE_NAME,
          ExclusiveStartKey: commandOutput.LastEvaluatedKey,
        })
      );
      items.push(...(commandOutput.Items ?? []));
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ data: items }),
    };
  } catch (error) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

