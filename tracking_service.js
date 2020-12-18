const rp = require('./node_modules/request-promise-native'),
 _ = require('./node_modules/lodash');


 // adyen milestones..
const MileStones = {
"SoftAllocated": {"index": 'usa-fulfillment-soft-allocation-feed', '_source': ["created_date"], 'key': 'line_item_id' },
//"PaymentAuthorized": {"index": '',  '_source': ["created_date"]},
//"OrderPlaced": {"index": '', '_source': ["created_date"]},
//"FraudClearenceDone": {"index": '', '_source': ["created_date"]},
"PoSubmitted": {"index": 'usa-fulfillment-purchase-order-feed', '_source': ["created_date"], 'key': 'po_id'},
"PoRouted": {"index": 'usa-fulfillment-purchase-order-fulfillment-feed', '_source': ["created_date"], 'key': 'line_item_id'},
"SoSubmitted": {"index": 'usa-fulfillment-sales-order-line-item-feed', '_source': ["created_date"], 'key': 'line_item_id'},
//"DoCreated": {"index": '', '_source': ["created_date"]},
//"Shipped": {"index": '', '_source': ["created_date"]},
//"Delivered": {"index": '', '_source': ["created_date"]},
//"Billed": {"index": '', '_source': ["created_date"]},
}


 const searchUrl = (index, scroll=false) => {
    var search = "_search"
    if (scroll)
    {search = "_search?scroll=5m"}
    return `https://kibanadata.prod.us.samsung.io/elasticsearch/${index}/${search}`
  }
  const scrollUrl = () => {
    return 'https://kibanadata.prod.us.samsung.io/api/console/proxy?path=/_search/scroll&method=POST'
  }
  const constructScrollQuery = (scrollId) => {
    return {
      "scroll" : "5m", 
      "scroll_id" : scrollId 
    }
  }
  const fetchData = async function fetchData(url, query) {
    const options = {
      method: "POST",
      url: url,
      rejectUnauthorized: false,
      headers: {
        "authorization": "Basic a2liYW5hdXNlcjpLS2JneXlSWlZWY1lqQVI=",
        "kbn-version": "6.8.5",
        "content-type": "application/json"
      },
      body: JSON.stringify(query)
    }
    try {
      const response = await rp(options)
      return JSON.parse(response);
    } catch (e) {
      console.log(e);
    }
  }
  

class TrackingService {
    constructor() {

    }

    // need to provide some template details -> need which payment method..
    async getOrderDetails(poId) {
        var searchurl = searchUrl("usa-fulfillment-soft-allocation-feed", false);
        //var scrollurl = scrollUrl();
        var Esquery = {
            "size": "10",
            "query": {
             "terms":{
                "po_id":[poId]
              }
            },
            "_source": milestone['_source']
         }
         if(milestone['key'])
        var result = await fetchData(searchurl, Esquery)    
        var hits = result.hits.hits
        if (hits.length == 0) {
            return {};
        }
        let response = {};
        response['po_id'] =  poId;
        response['line_items'] = []; 
        for (var i =0; i < hits.length; i++){
            var res = hits[i]["_source"];
            response['line_items'].push({
                line_item_id: res['line_item_id'],
                sku: res['common_code'],
                created_date: res['created_date']
            })
        }
        return response;
    }

    async getLineItemMileStones(poId, lineItemId) {

      let response = {};
      for(let i = 0; i < _.keys(MileStones).length; i++) {
        let name = _.keys(MileStones)[i];
        let milestone = MileStones[name];
        response[name] = {};
        var searchurl = searchUrl(milestone['index'], false);
        var Esquery = {
          "size": "10",
          "query": {
           "terms":{
              "po_id":[poId]
            }
          },
          "_source": milestone['_source']
       }
       if(milestone['key'] == 'line_item_id') {
         Esquery["query"]['terms'] = {"line_item_id": [lineItemId]}
       }
       var result = await fetchData(searchurl, Esquery)    
       var hits = result.hits.hits
       if (hits.length > 0) {
        var res = hits[0]["_source"];
        response[name]['created_date'] = res['created_date']
       }
      }
      return response;
  }

  async getOrderDetails(poId) {
      var searchurl = searchUrl("usa-fulfillment-soft-allocation-feed", false);
      //var scrollurl = scrollUrl();
      var Esquery = {
          "size": "10",
          "query": {
           "terms":{
              "po_id":[poId]
            }
          },
          "_source": ["common_code", "po_id", "line_item_id", "created_date"]
       }
      var result = await fetchData(searchurl, Esquery)    
      var hits = result.hits.hits
      if (hits.length == 0) {
          return {};
      }
      let response = {};
      response['po_id'] =  poId;
      response['line_items'] = []; 
      for (var i =0; i < hits.length; i++){
          var res = hits[i]["_source"];
          response['line_items'].push({
              line_item_id: res['line_item_id'],
              sku: res['common_code'],
              created_date: res['created_date']
          })
      }
      return response;
  }
    
}
module.exports = TrackingService;