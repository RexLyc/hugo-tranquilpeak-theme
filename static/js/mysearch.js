
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
        document.getElementById('search-value').innerText="搜索\"" + value + "\"";
        for(var page of document.getElementsByName('main-page')){
            page.style.display='none';
        }
        for(var page of document.getElementsByName('search-list')){
            page.style.display='block';
            // showResults(document.getElementById('search-result'),posts)
            // showResultsCount(document.getElementById('search_count'),document.getElementById('search_none'),posts.length)
        }
        console.log("input value: ",value)
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
  threshold: 0.0,
  tokenize:true,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    {name:"title",weight:0.8},
    {name:"contents",weight:0.5},
    {name:"tags",weight:0.3},
    {name:"categories",weight:0.3}
  ]
};

var searchQuery;

function executeSearch(searchQuery){
    console.log("searchQuery:%o",searchQuery);
    $.getJSON( "/index.json", function( data ) {
        var pages = data;
        var fuse = new Fuse(pages, fuseOptions);
        var result = fuse.search(searchQuery);
        console.log({"matches":result});
        if(result.length > 0){
            populateResults(result,searchQuery);
        }else{
            $('#search-results').append("<p>No matches found</p>");
            $('.search-list').html("haha")
        }
    });
}

function populateResults(result,searchQuery){
  $.each(result,function(key,value){
    var contents= value.item.contents;
    var snippet = "";
    var snippetHighlights=[];
    var tags =[];
    if( fuseOptions.tokenize ){
      snippetHighlights.push(searchQuery);
    }else{
      $.each(value.matches,function(matchKey,mvalue){
        if(mvalue.key == "tags" || mvalue.key == "categories" ){
          snippetHighlights.push(mvalue.value);
        }else if(mvalue.key == "contents"){
          start = mvalue.indices[0][0]-summaryInclude>0?mvalue.indices[0][0]-summaryInclude:0;
          end = mvalue.indices[0][1]+summaryInclude<contents.length?mvalue.indices[0][1]+summaryInclude:contents.length;
          snippet += contents.substring(start,end);
          snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0],mvalue.indices[0][1]-mvalue.indices[0][0]+1));
        }
      });
    }

    if(snippet.length<1){
      snippet += contents.substring(0,summaryInclude*2);
    }
    console.log(snippet)
  });
}

function param(name) {
    return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}