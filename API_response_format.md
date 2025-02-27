# API Response Format Documentation

## Overview
This document describes the standard JSON format for API responses to ensure consistency and clarity in communication between the client and server.

## Response Structure
All API responses will follow the structured format below:

```json
{
  "success": true,
  "code": 200,
  "message": "Ok",
  "data": []
}
```

### Fields Description

| Field     | Type    | Description |
|-----------|--------|-------------|
| `success` | Boolean | Indicates whether the API request was successful (`true`) or failed (`false`). |
| `code`    | Integer | HTTP status code representing the outcome of the request. |
| `message` | String  | A brief message describing the result of the API request. |
| `data`    | Array/Object | The main payload of the response, containing requested data or an empty array/object if no data is returned. |

## Response Examples

### Successful Response
```json
{
  "success": true,
  "code": 200,
  "message": "Request successful",
  "data": [
    {
      "id": 1,
      "name": "Example Item",
      "description": "This is an example description."
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "code": 400,
  "message": "Invalid request parameters",
  "data": {}
}
```

### Unauthorized Access
```json
{
  "success": false,
  "code": 401,
  "message": "Unauthorized access",
  "data": {}
}
```

### Server Error
```json
{
  "success": false,
  "code": 500,
  "message": "Internal server error",
  "data": {}
}
```

## HTTP Status Codes
The `code` field follows standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200  | OK - Request was successful. |
| 201  | Created - Resource was successfully created. |
| 400  | Bad Request - The request parameters were invalid. |
| 401  | Unauthorized - Authentication is required. |
| 403  | Forbidden - Access is denied. |
| 404  | Not Found - The requested resource was not found. |
| 500  | Internal Server Error - A server error occurred. |
