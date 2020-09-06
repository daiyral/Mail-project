document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#single_mail').style.display='none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#card-view').style.display='none';
  document.querySelector('#no_mail').style.display='none';
  document.querySelector('#alert_error').style.display='none';
  document.querySelector('#alert_success').style.display='none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields if it's not a reply
  if(!localStorage.getItem('reply_flag'))
    localStorage.setItem('reply_flag',0)
  reply_flag=localStorage.getItem('reply_flag')  
  if(reply_flag==0)
  {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-recipients').readOnly=false;
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-subject').readOnly=false;
    document.querySelector('#compose-body').value = '';
    document.querySelector('#compose-body').readOnly = false;
    document.querySelector('#submit').value='Send';
    document.querySelector('#compose-reply').style.display='none';
  }
  document.querySelector('#compose-reply').value='';
  localStorage.setItem('reply_flag',0)//reset flag
  

  document.querySelector('#compose-form').onsubmit = () => {

    const recipients=document.querySelector('#compose-recipients');
    const subject=document.querySelector('#compose-subject');
    const body=document.querySelector('#compose-body');
    const reply=document.querySelector('#compose-reply');
    const user=document.querySelector('#user');
    if(reply_flag==1)
    {
      let arr=new Array(200).fill("-");
       var final_reply=`\n ${arr.join('')}\n${user.value} Replied: ${reply.value}`
       body.value+=final_reply;
    }
    fetch('/emails',{
      method:'POST',
      body: JSON.stringify({
        recipients:`${recipients.value}`,
        subject:`${subject.value}`,
        body:`${body.value}`
      })
    })
    .then(response => response.json())
    .then(result => {
      //print result in console
      console.log(result);
      if(result.error)
      {
        document.querySelector('#alert_error').innerHTML=result['error'].replace(/['']+/g,'');
        $('#alert_error').show();
      }
      else
      {
        
        document.querySelector('#alert_success').innerHTML=result['message'].replace(/['']+/g,'');
        document.querySelector('#alert_error').style.display='none';
        $('#alert_success').show();
        setTimeout(()=>{
          load_mailbox('sent');},1000);

      }
     
   
    });
    return false;//need to redirect user to sent page

  }

  


 
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#single_mail').style.display='none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#card-view').style.display='block';
  document.querySelector('#no_mail').style.display='block';
  document.querySelector('#alert_error').style.display='none';
  document.querySelector('#alert_success').style.display='none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //reset no_mail message
  document.querySelector('#no_mail').innerHTML='';  
  //reset flag
  localStorage.setItem('email_flag',0);
  //reset all email posts
  var myemails=document.getElementById("email_list");
  while(myemails.firstChild){
    myemails.removeChild(myemails.lastChild);
  }

  fetch(`/emails/${mailbox}`)
  .then (response => response.json())
  .then(emails=> {
    //print emails in console
    console.log(emails);
    console.log(emails.read);
    //if theres emails
    if (emails.length>0)
    {
      if(mailbox=='inbox')  
      {
        emails.forEach(add_email);//make cards for each email
        emails.forEach(is_read);//change color if email has been read
      }
    
      if(mailbox=='sent')
      {
        localStorage.setItem('email_flag',1);//flag to know we are making cards for sent box 
        emails.forEach(add_email); //make cards for sent mail
        emails.forEach(is_read);//change color if email has been read
      }
      if(mailbox=='archive')
      {
        for(let i=0;i<emails.length;i++)
        {
          if(emails[i].archived==true)
          {
            add_email(emails[i]);
            is_read(emails[i]);
          }
        }
      }
    }
    else
      document.getElementById("no_mail").innerHTML=`No emails in ${mailbox}.`
  });
}


function add_email(email){
  //contents
  let email_flag=localStorage.getItem('email_flag');
  let contents={
    To:`${email.recipients}`,
    From:`${email.sender}`,
    Subject:`${email.subject}`,
    Date:`${email.timestamp}`,
    Body:`${email.body}`
  }

//cases for no subject
  if(contents['Subject']==='')
    contents['Subject']='(no subject)'  

  //create new mail
  var new_card=document.createElement("LI");
  new_card.classList.add('list-group-item','email_card');
  new_card.id=`${email.id}`;
  var link=document.createElement("a");
  link.href="#";
  link.className='stretched-link';
  new_card.appendChild(link);

   //bold elements
   var bold=document.createElement("p");
   bold.className="font-weight-bold";
  if(email_flag==='1')
    var bold_text=document.createTextNode(`To: ${contents['To']}`+'\xa0\xa0\xa0\xa0\xa0\xa0');
  else
    var bold_text=document.createTextNode(`${contents['From']}`+'\xa0\xa0\xa0\xa0\xa0\xa0');
  bold.appendChild(bold_text);


  //regular elements
  var reg=document.createElement("p");
  reg.className='font-weight-normal';
  if(contents['Body']!='')
    var reg_text=document.createTextNode(`${contents['Subject']}`+'\xa0'+'-'+'\xa0')
  else  
    var reg_text=document.createTextNode(`${contents['Subject']}`);
  reg.appendChild(reg_text);

  //muted elements
  var muted=document.createElement("p");
  muted.className='text-muted';
  if(contents['Body'].length >90)
  {
    var body=contents['Body'].substring(0,60)+'...';
    var muted_text= document.createTextNode(`${body}`);
  }
  else
    var muted_text= document.createTextNode(`${contents['Body']}`);
  muted.appendChild(muted_text);

  //align right elements
  var right=document.createElement("p");
  right.classList.add('right-align-text','text-muted');
  var right_text=document.createTextNode(`${contents['Date']}`);
  right.appendChild(right_text);

  //add to a card
  new_card.appendChild(bold);
  new_card.appendChild(reg);
  new_card.appendChild(muted);
  new_card.appendChild(right);
  new_card.addEventListener('click',function(){
    fetch(`/emails/${email.id}`,{
      method:'PUT',
      body:JSON.stringify({
        read:true
      })
    })
    display_email(contents,email)
    
  });
  document.getElementById("email_list").appendChild(new_card);



}

function display_email(contents,email)
{
  //reset view
  document.querySelector('#email_content').innerHTML='';
  // Show the mail and hide other views
  document.querySelector('#single_mail').style.display='block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#card-view').style.display='none';
  document.querySelector('#no_mail').style.display='none';
  document.querySelector('#alert_error').style.display='none';
  document.querySelector('#alert_success').style.display='none';
  document.querySelector('#compose-view').style.display = 'none';



  //display mail
    for (var key in contents){
      var element=document.createElement('LI');
      element.className="list-group-item";

      //bold elements
      if(key!='Body')//dont display the key body 
      {
        var element_bold=document.createElement('p');
        element_bold.className='font-weight-bold';
        bold_cont=document.createTextNode(`${key}:`+'\xa0');
        element_bold.appendChild(bold_cont);
        element.appendChild(element_bold);
          //regular text
        var element_text=document.createTextNode(`${contents[key]}`);
        element.appendChild(element_text);
        document.getElementById('email_content').appendChild(element);
      }
    
      if(key=='Body')
      {
        var pre=document.createElement('pre');
        var element_text=document.createTextNode(`${contents[key]}`);
        pre.appendChild(element_text);
        element.appendChild(pre);
        document.getElementById('email_content').appendChild(element);
        var archive=document.createElement('a');
        archive.id='archive';
        var archive_icon=document.createElement('i');
        archive.href='#';
        var reply=document.createElement('a');
        var reply_icon=document.createElement('i');
        reply_icon.className='fas fa-reply';
        reply.href='#';
        reply.title='reply';
        reply.appendChild(reply_icon);
        if(email.archived==false)
        {
          archive.title='Archive';
          archive_icon.className='fas fa-folder-plus';
        }
        else
        {
          archive.title='Remove Archive';
          archive_icon.className='fas fa-folder-minus'
        }
        //try to add the ability to click again to remove or add without refreshing 
        archive.appendChild(archive_icon);
        element.appendChild(archive);
        element.appendChild(reply);
        archive.addEventListener('click',function(){
          archive_email(email,archive_icon)
        });
        reply.addEventListener('click',function(){
            reply_email(email);
        })
      }
        
    }

}
function reply_email(email)
{
  document.querySelector('#compose-reply').style.display='block';
  localStorage.setItem('reply_flag',1)
  document.querySelector('#submit').value='Reply';
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  document.querySelector('#compose-recipients').readOnly=true;
 
  document.querySelector('#compose-body').readOnly=true;
  if(email.subject.substring(0,2)=='Re')
  {
    document.querySelector('#compose-subject').value = `${email.subject}`;
    document.querySelector('#compose-body').value=`${email.body}`;
  }
  else  
  {
    document.querySelector('#compose-body').value=`On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-subject').readOnly=true;
  compose_email();
}
function archive_email(email,archive_icon){
 
  if(email.archived==false)
  {
    document.querySelector('#alert_success').innerHTML='Email has been archived';
    document.getElementById('alert_success').style.animationPlayState='running';
    //archive_icon.className='fas fa-folder-minus';
    $('#alert_success').show();
    fetch(`/emails/${email.id}`,{
      method:'PUT',
      body:JSON.stringify({
        archived:true
      })
    })
  }
  if(email.archived==true)
  {

    document.querySelector('#alert_success').innerHTML='Email has been removed from archive';
    document.getElementById('alert_success').style.animationPlayState='running';
    //archive_icon.className='fas fa-folder-plus';
    $('#alert_success').show();
    fetch(`/emails/${email.id}`,{
      method:'PUT',
      body:JSON.stringify({
        archived:false
      })
    })

  }
  
  return false;
}

function is_read(email){

  if (email.read==true)
    document.getElementById(`${email.id}`).style.backgroundColor='#f2f2f2';
}