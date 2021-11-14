console.log("Literary Structure Analysis");

var q = d3.text("/data/Alice-text-raw.txt", function(raw_text) {
    //console.log(data);

    var formatted = createJSONstructure(raw_text);

    console.log(formatted);
    return formatted;

});

//
//
// plot sunburst graph
//
//

// Variables
var width = 900;
var height = 900;
var radius = Math.min(width, height) / 2;
var color = d3.scaleOrdinal(d3.schemeCategory20b);

// Create primary <g> element
var g = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

// Data strucure
var partition = d3.partition()
    .size([2 * Math.PI, radius]);

// Find data root
var root = d3.hierarchy(q)
    .sum(function (d) { return d.size});

// Size arcs
partition(root);
var arc = d3.arc()
    .startAngle(function (d) { return d.x0 })
    .endAngle(function (d) { return d.x1 })
    .innerRadius(function (d) { return d.y0 })
    .outerRadius(function (d) { return d.y1 });

// Put it all together
g.selectAll('path')
    .data(root.descendants())
    .enter().append('path')
    .attr("display", function (d) { return d.depth ? null : "none"; })
    .attr("d", arc)
    .style('stroke', '#fff')
    .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); });

//
//
// Nested JSON Structure
//
//

function createJSONstructure(t) {

    var whole_book = {  name: "Book 1",
                        title: "Alice's Adventures in Wonderland",
                        children_are: "Chapters",
                        children: split_into_chapters(t) };
    
                        //console.log(whole_book);
    return whole_book;

}


function split_into_chapters(s) {

    //console.log(s);

    var regEx = new RegExp('CHAPTER '
                            +'[A-Z]*'
                            +'\.\n'
                            ); //split by word 'CHAPTER' then roman numerals and period
    var chapters_array = s.split(regEx); 
    chapters_array.shift(); // remove first thing in array because its blank

    //console.log(chapters_array);

    var chapter_count = 0;
    var chapter_array = [];
    chapters_array.forEach( function (d) {
        
        //console.log(d);

        chapter_count++; 
        return chapter_array.push( {name: "Chapter "+chapter_count, 
                                    title: extract_chapter_title(d), 
                                    children_are: "Paragraphs", 
                                    chapter_no: chapter_count, 
                                    children: split_into_paragraphs(d) 
                                    }) 
    });
    
    //console.log(chapter_array);
    return chapter_array; 

} //--end of split chapters


function extract_chapter_title(chapter){

    var first_line = chapter.split('\n')[0];
    //console.log(first_line);

    return first_line;
} //--end of extract ch title


function split_into_paragraphs(chapter){

    var paragraph_edit = chapter    .replace(/[*]/gm, "")
                                    //.replace(/--/gm, " ")
                                    .replace(/\s(?=\S)/gm, ' ')
                                    .replace(/\s{3,}/gm, "\n")
                                    .replace(/-/gm, ' ')
                                    .replace(/^ /, '');

    var paragraph_array = paragraph_edit.split("\n");

    paragraph_array.shift();
    paragraph_array.pop();

    var paragraph_count = 0;
    var paragraph_array_of_objects = [];

    paragraph_array.forEach( function(f) {
        paragraph_count++;
        return  paragraph_array_of_objects.push( {  name: "Paragraph "+paragraph_count,
                                                    title: "Paragraph "+paragraph_count,
                                                    children_are: "Sentences",
                                                    paragraph_no: paragraph_count,
                                                    children: split_into_sentences(f) 
                                                })
     })

    //console.log(paragraph_array_of_objects);

    return paragraph_array_of_objects;
} //--end of split into paragraphs


function split_into_sentences(paragraph) {

    //console.log(paragraph);

    // var sentences_formatted = paragraph.replace(/([.?!])(\s|\)|["'])(?!( said)|( he said))/g, "$1|").split("|");
    var sentences_formatted = paragraph.replace(/([.?!])(\s|\)|["'])(?!( [a-z]))/g, "$1|").split("|");
    var sentences_cleaned = sentences_formatted.filter(entry => entry.trim() != '');
    //console.log(sentences_cleaned);

    var sentence_count = 0;
    var sentence_array_of_objects = [];

    sentences_cleaned.forEach( function(g) {
        sentence_count++;
        return sentence_array_of_objects.push({ name: "Sentence "+sentence_count,
                                                children_are: "Words",
                                                sentence_no: sentence_count,
                                                sentence: g,
                                                size: g.split(' ').length,
                                                alice: g.indexOf("Alice") })
                                                //children: split_into_words(g) 
    })

    //console.log(sentence_array_of_objects);

    return sentence_array_of_objects;
} //--end of split into sentences
