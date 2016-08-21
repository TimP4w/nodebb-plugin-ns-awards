<div class="awards">
    <!-- IMPORT partials/breadcrumbs.tpl -->

    <!-- BEGIN awards -->
    <div class="row awards-overview">

        <div class="col-md-1">
            <img src="{awards.picture}" class="img-responsive"/>
        </div>
        <div class="col-md-6 award-summary">
            <span class="award-title">{awards.name}</span>
            <span class="award-desc">{awards.desc}</span>
        </div>
        <div class="col-md-5 award-owners">
            <!-- BEGIN awards.grants -->
            <span class="award-recipient">
              <!-- IF awards.grants.user.picture -->
                <a href="./user/{awards.grants.user.userslug}"><img class="user-img" title="" alt="{awards.grants.user.username}" src="{awards.grants.user.picture}" data-original-title="{awards.grants.user.username}" ></a>
              <!-- ELSE -->
                <a href="./user/{awards.grants.user.userslug}"><div class="user-icon" style="background-color: {awards.grants.user.icon:bgColor};">{awards.grants.user.icon:text}</div></a>
              <!-- ENDIF awards.grants.user.picture -->    
           </span>      
           <!-- END awards.grants -->
        </div>
    </div>
    <!-- END awards -->
</div>