/* eslint-disable no-undef */
// Client facing scripts here
$(document).ready(function() {
  views_manager.navBarRender('navBarUser');
  getAllMenuItems().then(function(json) {
    window.itemStock = json;
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
      orderSummary.addToCart(getItemId(itemName));
      $("nav p").text(itemCount);
    });
  });

  views_manager.navBarRender('navBarAdmin');
  getAllMenuItems().then(function(json) {
    adminMenuItems.adminAddMenuItems(json);
    views_manager.render("adminMenuList");

    // $(".delete-button").on("click", function() {
    //   itemManager.selectedItem = $(this)
    //     .parent()
    //     .parent()
    //     .find("p")[0].innerText;
    //   console.log(itemManager.selectedItem);
    //   views_manager.overlay("itemDeletePopup");
    // });

    $(".card__footer button").on("click", function() {
      views_manager.overlay("itemEditPopup");
    });

    $(".add-button").on("click", function() {
      views_manager.overlay("createItemForm");
    });
    views_manager.render("menuList");
  });

  views_manager.navBarRender('navBarUser');
  views_manager.render("menuList");
  // addNewItem()
  // createOrder().then(function(json) {
  //   console.log(json);
  // });
});
