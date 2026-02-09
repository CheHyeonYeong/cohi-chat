#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -s "http://localhost:9200/_cluster/health" | grep -q '"status":"green"\|"status":"yellow"'; do
    sleep 5
done
echo "Elasticsearch is ready!"

# Create ILM Policy
echo "Creating ILM policy..."
curl -X PUT "http://localhost:9200/_ilm/policy/cohi-chat-logs-policy" -H "Content-Type: application/json" -d '
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "5gb",
            "max_docs": 1000000
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "readonly": {}
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'

echo ""
echo "ILM policy created!"

# Create Index Template
echo "Creating index template..."
curl -X PUT "http://localhost:9200/_index_template/cohi-chat-logs-template" -H "Content-Type: application/json" -d '
{
  "index_patterns": ["cohi-chat-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "cohi-chat-logs-policy",
      "index.lifecycle.rollover_alias": "cohi-chat-logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "timestamp": {
          "type": "date"
        },
        "level": {
          "type": "keyword"
        },
        "logger": {
          "type": "keyword"
        },
        "thread": {
          "type": "keyword"
        },
        "message": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "stack_trace": {
          "type": "text"
        },
        "application": {
          "type": "keyword"
        },
        "service": {
          "type": "keyword"
        },
        "environment": {
          "type": "keyword"
        },
        "requestId": {
          "type": "keyword"
        },
        "userId": {
          "type": "keyword"
        },
        "traceId": {
          "type": "keyword"
        }
      }
    }
  },
  "priority": 100
}'

echo ""
echo "Index template created!"

echo ""
echo "=== ELK Setup Complete ==="
echo "ILM Policy: cohi-chat-logs-policy"
echo "  - Hot phase: 0-7 days (rollover at 1 day, 5GB, or 1M docs)"
echo "  - Warm phase: 7-30 days (readonly)"
echo "  - Cold phase: 30-90 days"
echo "  - Delete: after 90 days"
echo ""
echo "Index Template: cohi-chat-logs-template"
echo "  - Pattern: cohi-chat-logs-*"
