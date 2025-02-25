function create_thmb(img_dir,img_file){
  if (typeof img_file === "undefined") return;
  let div = document.createElement("div");
  let img_res = document.getElementById('img_res');
  div.classList.add("thmb_img");
  div.onclick = function () { select_edit(this); };
  div.oncontextmenu = function () { full_screen(this); };
  let img = document.createElement("img");

  img.classList.add("full");
  img.src = '/img/' + img_dir + '/'+ img_file +'?pro=' + project;
  div.appendChild(img);
  let p = document.createElement("p");
  p.innerHTML = img_file;
  div.appendChild(p);
  img_res.appendChild(div);
}

function load_set(){
  if (loading) return;
  let img_res = document.getElementById('img_res');
  if (images.length == document.getElementsByClassName('thmb_img').length) return;
  let cur_dir = document.getElementById('cur_img_dir').innerHTML
  
  loading = true;
  let c = document.getElementsByClassName('thmb_img').length;
  for (var i = c + 1; i <= c + 20; i++) {
    create_thmb(cur_dir,images[i])
  }
  loading = false;
}

function disable_folder_button(){
  let ch_btns = document.getElementsByClassName('change_folders');
  let cd = document.getElementById('cur_img_dir').innerHTML
  for (var i = 0; i < ch_btns.length; i++) {
    if(ch_btns[i].value == cd){
      ch_btns[i].disabled = true
    } else{
      ch_btns[i].disabled = false
    }
  }
}
function scroll_div(){
  const img_res = document.getElementById('img_res');
  const cur_image_count = document.getElementsByClassName('thmb_img').length;
  if (cur_image_count == images.length) {
    return
  } else if (Math.ceil(img_res.clientHeight + img_res.scrollTop) >=Math.ceil(img_res.scrollHeight*0.8)){
    load_set();
  };
}

function select_edit(item){item.classList.toggle("selected");}

function sel_all(){
  all_thumbs = document.getElementsByClassName('thmb_img');
  for (var i = 0; i < all_thumbs.length; i++) {
    
    select_edit(all_thumbs[i]);
  }
}
function full_screen(item) {
  let a = document.createElement('a');
  a.href = item.children[0].src
  let d = document.createElement("div")
  let img = document.createElement("img")
  img.src = a.pathname + a.search
  if (img.naturalHeight > img.naturalWidth){
    img.classList.add('almost_tall')
  } else {
    img.classList.add('almost')
  }
  d.appendChild(img)
  display_modal('info',d,'blue');
}

function search_images(){
  let filter = document.getElementById("img_search").value.toUpperCase();
  let cur_dir = document.getElementById('cur_img_dir').innerHTML
  if (filter.length == 0){
    window.images = all_images;
    for (i = 0; i < images.length; i++) {
      create_thmb(cur_dir,images[i])
      if (i >= 30) {break;}
    }
    return;
  } else { 
    let filterd = [];
    for (i = 0; i < all_images.length; i++) { 
      if (all_images[i].toUpperCase().indexOf(filter) > -1) {
        filterd.push(all_images[i]);
      }
    }
    window.images = filterd
    document.getElementById('img_res').innerHTML = ''
    for (i = 0; i < images.length; i++) {
      create_thmb(cur_dir,images[i])
      if (i >= 30) {break; return;}
    }
  }
}

function mass_action(action) {
  let selected = document.getElementsByClassName('selected');
  for (let i=0;i<selected.length;i++){
    if(action == 'move'){
      let formData = new FormData();
      formData.append('project', project);
      formData.append('cur_img_dir', document.getElementById('cur_img_dir').innerHTML);
      formData.append('mv_fname', selected[i].children[1].innerHTML);
      let xhr = new XMLHttpRequest();
      xhr.withCredentials = false;
      xhr.addEventListener("readystatechange", function() {
        if(this.status == 304) {
          this.abort();
        } else {
          this.abort();
        }
      });
      xhr.open("POST", "/mv/"+ document.getElementById('mv_to').value);
      xhr.send(formData);
    } else if (action=='del'){
      let formData = new FormData();
      formData.append('project', project);
      formData.append('cur_img_dir', document.getElementById('cur_img_dir').innerHTML);
      formData.append('del_fname', selected[i].children[1].innerHTML);
      let xhr = new XMLHttpRequest();
      xhr.withCredentials = false;
      xhr.addEventListener("readystatechange", function() {
        if(this.status == 302) {
          this.abort();
        } else {
          this.abort();
        }
      });
      xhr.open("POST", "/delete");
      xhr.send(formData);
    }
  }
  select_folder(document.getElementById('cur_img_dir').innerHTML);
  close_model();
}

function verify_mass_action(action) {
  let selected = document.getElementsByClassName('selected');
  for (let i=0;i<selected.length;i++){
    let a = document.createElement('a');
    a.href = selected[i].children[0].src
  }
  if (action == 'move'){
    let cd = document.getElementById('cur_img_dir').innerHTML
    let title_d = ''
    if (project.includes(cd)){
      title_d = 'Review'
    } else {
      title_d = cd.replace('_', ' ')
      title_d = title_d.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    let d = document.createElement("div")
    let p = document.createElement("p")
    let text = 'Please select the directory to move the ' + selected.length + ' images to.'
    p.innerHTML = text
    d.appendChild(p) 
    let form = document.createElement("form");
    let opt = document.createElement("select");
    for (i=0;i<all_dirs.length;i++){
      if (all_dirs[i]['name'] != title_d){
        opt.options.add( new Option(all_dirs[i]['name'],all_dirs[i]['location']))
      }
    }
    opt.id = 'mv_to'
    form.appendChild(opt);
    d.appendChild(form)
    let btn = document.createElement("button");
    btn.type = 'button'
    btn.innerHTML = 'Confirm'
    btn.setAttribute("onclick", "mass_action('" + action + "')")
    d.appendChild(btn)
    let btn1 = document.createElement("button");
    btn1.type = 'button'
    btn1.innerHTML = 'Go Back'
    btn1.setAttribute("onclick", "open_close('modal')")
    d.appendChild(btn1)
    display_modal('Info', d, 'blue')

  } else if (action='del'){
    let d = document.createElement("div")
    let p = document.createElement("p")
    let text = 'Are you sure you want to delete the selected ' + selected.length + ' images.<b>This can not be undone.<b>'
    p.innerHTML = text
    d.appendChild(p)
    let btn = document.createElement("button");
    btn.type = 'button'
    btn.innerHTML = 'Confirm'
    btn.setAttribute("onclick", "mass_action('" + action + "')")
    d.appendChild(btn)
    let btn1 = document.createElement("button");
    btn1.type = 'button'
    btn1.innerHTML = 'Go Back'
    btn1.setAttribute("onclick", "open_close('modal')")
    d.appendChild(btn1)
    display_modal('Warning', d, 'red')    
  }
}

function select_folder(folder){
  let formData = new FormData();
  formData.append('project', project);
  formData.append('new_folder', folder);

  let xhr = new XMLHttpRequest();
  xhr.withCredentials = false;
  xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      let obj = JSON.parse(this.responseText);
      document.getElementById('cur_img_dir').innerHTML = obj['path'];
      document.getElementById('img_res').innerHTML = '';
      window.all_images = obj['files']
      window.images = obj['files']
      for (var i = 0; i < obj['files'].length; i++) {
        create_thmb(folder,obj['files'][i])
        if (i >= 30)  { break; }
      }
    }
    disable_folder_button()
  });
  xhr.open("POST", "/select_folder/" + folder);
  xhr.send(formData);
}

function upload_images(){
  let formData = new FormData(document.getElementById('upload_images'));
  formData.append('project', project);
  let xhr = new XMLHttpRequest();
  xhr.withCredentials = false;
  xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      select_folder(document.getElementById('cur_img_dir').innerHTML);
      close_model();  
    }

  });
  xhr.open("POST", "/upload/" + document.getElementById('cur_img_dir').innerHTML);
  xhr.send(formData);

}

function upload_images_form(){
    let d = document.createElement("div")
    let p = document.createElement("p")
    let text = 'Please select images to upload to the ' + document.getElementById('cur_img_dir').innerHTML + ' folder.'
    p.innerHTML = text;
    d.appendChild(p);
    let form = document.createElement("form");
    form.id = 'upload_images'

    let file_input = document.createElement("input");
    file_input.type = 'file';
    file_input.name = 'image';
    file_input.multiple = true;
    form.appendChild(file_input);

    d.appendChild(form);
    d.appendChild(document.createElement("br"));
    d.appendChild(document.createElement("br"));

    let btn = document.createElement("button");
    btn.type = 'button';
    btn.setAttribute("onclick", "upload_images()")
    btn.innerHTML = 'Upload';
    d.appendChild(btn);

    let btn1 = document.createElement("button");
    btn1.type = 'button'
    btn1.innerHTML = 'Go Back'
    btn1.setAttribute("onclick", "open_close('modal')")
    d.appendChild(btn1)
    
    display_modal('Upload Images', d, 'blue')
}