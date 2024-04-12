      async function submitPasswordReset() {
        var p = document.getElementById("p").value.trim();
        var cp = document.getElementById("cp").value.trim();
        if (p.length == 0 || cp.length == 0 || p == " " || cp == " ") {
          alert("Please enter a new password and confirm.");
          return;
        }
        if (p == cp) {
          const urlSearchParams = new URLSearchParams(window.location.search);
          const params = Object.fromEntries(urlSearchParams.entries());
          document.getElementById("y").classList.add("xyz");
          
          let body = { token: params.token, password: p };
          const response = await fetch(
            "https://wj5i7d6828.execute-api.us-east-1.amazonaws.com/auth/updatepassword",
            {
              method: "POST",
              body: JSON.stringify(body),
              headers: { "Content-type": "application/json" },
            }
          );
          const myJson = await response.json();
          if (myJson.statusCode == 400) {
            alert("Invalid token.");
            document.getElementById("y").classList.remove("xyz");
            return; 
          }
          console.log("response-->", myJson);
          document.getElementById("y").classList.remove("xyz");
          document.getElementById("x").innerHTML =
            `<h2 title="logo">
		<a href="https://greenpwr.com/">
		<img width="200" src="https://www.greenpwr.com/images/GreenPWR%20Main%20Logo.png" title="logo" alt="logo">
				</a>
	  </h2>
	        

      <div id ="y"></div>
      <div class="form">
        <h2>Your Password Updated Successfully.</h2>
      </div>`;
        } else {
          alert("Passwords do not match.");
          return;
        }
      };