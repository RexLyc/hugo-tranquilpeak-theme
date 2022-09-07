
function debounce(func,delay){
    var timeout;
    return function(...args){
        if(timeout)
            clearTimeout(timeout);
        timeout=setTimeout(()=>func.apply(this,args),delay)
    }
}

var onSearch=debounce((e)=>{
    var value = document.getElementById('searchInput').value;
    if(!value){
        for(var page of document.getElementsByName('main-page')){
            page.style.display='block';
        }
        for(var page of document.getElementsByName('search-list')){
            page.style.display='none';
        }
    } else {
        // begin search
        // var posts=searchPost(value)
        // document.getElementById('search-value').innerText="搜索\"" + value + "\"";
        for(var page of document.getElementsByName('main-page')){
            page.style.display='none';
        }
        for(var page of document.getElementsByName('search-list')){
            page.style.display='block';
            // showResults(document.getElementById('search-result'),posts)
            // showResultsCount(document.getElementById('search_count'),document.getElementById('search_none'),posts.length)
        }
        // console.log("input value: ",value)
        // executeSearch(param(value))
        executeSearch(value)
    }
},300)

$(document).ready(()=>{
    document.getElementById('searchInput').addEventListener('input',onSearch)
})

// -----------------------------------------------------------

summaryInclude=60;
var fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.3,
  location: 0,
  distance: 1000,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    {name:"title",weight:0.8},
    {name:"contents",weight:0.9},
    // {name:"tags",weight:0.3},
    // {name:"categories",weight:0.3}
  ]
};

var searchQuery;

function executeSearch(searchQuery){
    // console.log("searchQuery:%o",searchQuery);
    $.getJSON( "/index.json", function( data ) {
        var pages = data;
        var fuse = new Fuse(pages, fuseOptions);
        var result = fuse.search(searchQuery);
        // console.log({"matches":result});
        populateResults(result,searchQuery);
    });
}

function populateResults(result,searchQuery){
  var html='';
  $.each(result,function(key,value){
    // console.log(value)
    var contents= value.item.contents;
    var snippet = "";
    {
      $.each(value.matches,function(matchKey,mvalue){
        if(mvalue.key == "contents"){
          start = mvalue.indices[0][0]-summaryInclude>0?mvalue.indices[0][0]-summaryInclude:0;
          end = mvalue.indices[0][1]+summaryInclude<contents.length?mvalue.indices[0][1]+summaryInclude:contents.length;
          snippet += contents.substring(start,end);
        }
      });
    }

    if(snippet.length<1){
      snippet += contents.substring(0,summaryInclude*2);
    }
    
    var lang = window.navigator.userLanguage || window.navigator.language || value.item.lang;

    html += '<div class="media">';
    if (value.item.thumbnailImageUrl) {
      html += '<div class="media-left">';
      html += '<a class="link-unstyled" href="' + (value.item.link || value.item.permalink) + '">';
      html += '<img class="media-image" ' +
        'src="' + value.item.thumbnailImageUrl + '" ' +
        'width="90" height="90"/>';
      html += '</a>';
      html += '</div>';
    }

    html += '<div class="media-body">';
    html += '<a class="link-unstyled" href="' + (value.item.link || value.item.permalink) + '">';
    html += '<h3 class="media-heading">' + MarkHighLightCore(value.item.title,searchQuery) + '</h3>';
    html += '</a>';
    html += '<span class="media-meta">';
    html += '<span class="media-date text-small">';
    // html += moment(value.item.date).locale(lang).format('ll');
    html += value.item.date
    html += '</span>';
    html += '</span>';
    // searchQuery = AnalyzeHighLightWords(searchQuery);
    snippet = MarkHighLightCore(snippet,searchQuery)
    html += '<div class="media-content hide-xs font-merryweather">' + snippet + '</div>';
    html += '</div>';
    html += '<div style="clear:both;"></div>';
    html += '<hr>';
    html += '</div>';

  });
  // console.log(html)
  $('#search-results').html(html)
  // MarkHighLight($('#search-results'),searchQuery,null)
}

function param(name) {
    return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function MarkHighLightCore(obj,keyWords){
  // console.log(keyWords)
  // 通过添加[]来避免内部包含特殊字符，一律视为整体
  var reResult=new RegExp("(["+keyWords+"])", "gi"); 
  return obj.replace(reResult,"<span style='background:yellow'>$1</span>");
}

function AnalyzeHighLightWords(hlWords)
{
    if(hlWords==null) return "";
    hlWords=hlWords.replace(/\s+/g,"|").replace(/\|+/g,"|");            
    hlWords=hlWords.replace(/(^\|*)|(\|*$)/g, "");
    
    if(hlWords.length==0) return "";
    var wordsArr=hlWords.split("|"); 
    
    if(wordsArr.length>1){
        var resultArr=BubbleSort(wordsArr);
        var result="";
        for(var i=0;i<resultArr.length;i++){
            result=result+"|"+resultArr[i];
        }                
        return result.replace(/(^\|*)|(\|*$)/g, "");

    }else{
        return hlWords;
    } 
}    
//-----利用冒泡排序法把长的关键词放前面-----    
function BubbleSort(arr){        
  var temp, exchange;    
  for(var i=0;i<arr.length;i++){            
      exchange=false;                
      for(var j=arr.length-2;j>=i;j--){                
          if((arr[j+1].length)>(arr[j]).length){                    
              temp=arr[j+1]; arr[j+1]=arr[j]; arr[j]=temp;
              exchange=true;
          }
      }                
      if(!exchange)break;
  }
  return arr;            
}
