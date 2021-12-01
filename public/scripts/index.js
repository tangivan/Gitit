/* eslint-disable no-undef */
// Client facing scripts here
$(document).ready(function() {
  getAllMenuItems().then(function(json) {
    menuItems.addMenuItems(json);
    views_manager.render("menuList");

    //setup menu item button listeners
    let itemCount = 0;
    $("nav p").text(itemCount);
    $(".card__footer button").on("click", function() {
      itemCount++;
      //add item to cart object for calculating items
      const itemName = $(this)
        .parent()
        .parent()
        .find("p")[0].innerText;
      orderSummary.addToCart(itemName);
      $("nav p").text(itemCount);
    });
  });
  // cancelOrder().then(function(json) {
  //   console.log(json);
  // });
});
