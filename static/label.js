var slider = document.getElementById("image_idx");
var output = document.getElementById("file_idx");

function showresized(){
  let imgInput = document.getElementById('main-image');
  let imgOutput = document.getElementById('resized-image');
  if (imgInput.style.display == 'none'){
    imgInput.style.display = 'block'
    imgOutput.style.display = 'none'
  }else{
    imgOutput.src = imgInput.src
    imgOutput.height = 224;
    imgOutput.width = 224;
    imgInput.style.display = 'none'
    imgOutput.style.display = 'block'
  }
}

//slider.oninput = function() {
//  output.innerHTML = 'Go to file ' + filelist[this.value] + '';  
//}
function goto_image(imageID){
  window.location.href = '/?pro={{project}}&a=cat&f=' + filelist[imageID] + '&n='+imageID;
}

function open_section(div_id){
  console.log(div_id)
  closeNav()
  let divs = document.getElementsByClassName("displays");
  for (let i = 0; i < divs.length; i++){
    console.log(divs[i].id)
    if (divs[i].id == div_id){
      divs[i].style.display = 'block';
    } else{
      divs[i].style.display = 'none';
    }
  }
}

function delete_imge(){

  let formData = new FormData();
  formData.append('project', '{{project}}');
  formData.append('cur_img_dir','{{img_dir.location}}');
  formData.append('del_fname', '{{c_image}}');
  let xhr = new XMLHttpRequest();
  xhr.withCredentials = false;
  xhr.onreadystatechange = function() {
      // return if not ready state 4
      if (this.readyState !== 4) {
        return;
      }
      window.location.href = xhr.responseURL;   
  }
  xhr.open("POST", "/delete");
  xhr.send(formData);
}

function verify_del(){
    let d = document.createElement("div")
    let p = document.createElement("p")
    let text = 'Are you sure you want to delete {{c_image}}?';
    p.innerHTML = text
    d.appendChild(p)
    let btn = document.createElement("button");
    btn.type = 'button'
    btn.innerHTML = 'Confirm'
    btn.setAttribute("onclick", "delete_imge()")
    d.appendChild(btn)
    let btn1 = document.createElement("button");
    btn1.type = 'button'
    btn1.innerHTML = 'Go Back'
    btn1.setAttribute("onclick", "open_close('modal')")
    d.appendChild(btn1)
    display_modal('Info', d, 'blue')
}