
const { prisma } = require('../../../prisma');
const { objectType, extendType, intArg, nonNull, inputObjectType, stringArg, interfaceType, list, enumType } = require("nexus");
const { getUserById } = require("../../../auth/utils/helperFuncs");
const { removeNulls, defaultPrismaSelectFields } = require("./helpers");
const { ImageInput } = require('./misc');
const { Tournament } = require('./tournament');
const { resolveImgObjectToUrl } = require('../../../utils/resolveImageUrl');
const { deleteImage } = require('../../../services/imageUpload.service');
const { PrismaSelect } = require('@paljs/plugins');

const { parseResolveInfo } = require('graphql-parse-resolve-info')


const BaseUser = interfaceType({
    name: 'BaseUser',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('name');
        t.nonNull.string('avatar', {
            async resolve(parent) {
                if (parent.avatar_rel)
                    return resolveImgObjectToUrl(parent.avatar_rel);
                return prisma.user.findUnique({ where: { id: parent.id } }).avatar_rel().then(resolveImgObjectToUrl)
            }
        });
        t.nonNull.date('join_date');
        t.string('role');
        t.string('jobTitle')
        t.string('lightning_address')
        t.string('website')
        t.string('twitter')
        t.string('discord')
        t.string('github')
        t.string('linkedin')
        t.string('bio')
        t.string('location')
        t.nonNull.list.nonNull.field('roles', {
            type: MakerRole,
            resolve: async (parent) => {
                const data = await prisma.user.findUnique({
                    where: {
                        id: parent.id
                    },
                    select: {
                        roles: {
                            select: {
                                role: true,
                                level: true
                            }
                        },
                    }
                })
                return data.roles.map(data => {
                    return ({ ...data.role, level: data.level })
                })
            }
        })
        t.nonNull.list.nonNull.field('skills', {
            type: MakerSkill,
            resolve: (parent) => {
                return prisma.user.findUnique({ where: { id: parent.id } }).skills();
            }
        })
        t.nonNull.list.nonNull.field('tournaments', {
            type: Tournament,
            resolve: async (parent) => {
                return prisma.tournamentParticipant.findMany({
                    where: {
                        user_id: parent.id
                    },
                    include: {
                        tournament: true
                    }
                }).then(d => d.map(item => item.tournament))
            }
        })
        t.nonNull.list.nonNull.field('projects', {
            type: "Project",
            resolve: async (parent) => {
                return prisma.projectMember.findMany({
                    where: {
                        userId: parent.id
                    },
                    include: {
                        project: true
                    }
                }).then(d => d.map(item => item.project))
            }
        })
        t.nonNull.list.nonNull.field('similar_makers', {
            type: "User",
            resolve(parent,) {
                return prisma.user.findMany({
                    where: {
                        AND: {
                            id: {
                                not: parent.id
                            }
                        }
                    },
                    take: 3,
                })
            }
        })


        t.nonNull.list.nonNull.field('stories', {
            type: "Story",
            resolve: (parent) => {
                return prisma.story.findMany({ where: { user_id: parent.id, is_published: true }, orderBy: { createdAt: "desc" } });
            }
        });

        t.nonNull.boolean('in_tournament', {
            args: {
                id: nonNull(intArg())
            },
            resolve(parent, args) {
                return prisma.tournamentParticipant.findFirst({ where: { tournament_id: args.id, user_id: parent.id } }).then(res => !!res)
            }
        })


    },
    resolveType() {
        return null
    },
})



const RoleLevelEnum = enumType({
    name: 'RoleLevelEnum',
    members: {
        Beginner: 0,
        Hobbyist: 1,
        Intermediate: 2,
        Advanced: 3,
        Pro: 4,
    },
});

const GenericMakerRole = objectType({
    name: 'GenericMakerRole',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('title');
        t.nonNull.string('icon');
    }
})

const MakerRole = objectType({
    name: 'MakerRole',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('title');
        t.nonNull.string('icon');
        t.nonNull.field('level', { type: RoleLevelEnum })
    }
})

const getAllMakersRoles = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field('getAllMakersRoles', {
            type: GenericMakerRole,
            async resolve(parent, args, context) {
                return prisma.workRole.findMany();
            }
        })
    }
})


const MakerSkill = objectType({
    name: 'MakerSkill',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('title');
    }
})

const getAllMakersSkills = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field('getAllMakersSkills', {
            type: MakerSkill,
            async resolve(parent, args, context) {
                return prisma.skill.findMany();
            }
        })
    }
})


const User = objectType({
    name: 'User',
    definition(t) {
        t.implements('BaseUser')
    }
})

const MyProfile = objectType({
    name: 'MyProfile',
    definition(t) {
        t.implements('BaseUser')

        t.string('email')
        t.string('nostr_prv_key')
        t.string('nostr_pub_key')

        t.nonNull.list.nonNull.field('walletsKeys', {
            type: "WalletKey",
            resolve: (parent, _, context) => {
                return prisma.userKey.findMany({
                    where: {
                        user_id: parent.id,
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                })
                    .then(keys => keys.map(k => ({ ...k, is_current: k.key === context.user.pubKey })))
            }
        });
    }
})


const me = extendType({
    type: "Query",
    definition(t) {
        t.field('me', {
            type: "MyProfile",
            async resolve(parent, args, context, info) {
                if (!context.user?.id) return null;
                const select = new PrismaSelect(info, {
                    defaultFields: defaultPrismaSelectFields
                }).valueWithFilter('User');
                return prisma.user.findUnique({
                    ...select,
                    where: {
                        id: context.user.id
                    },
                })
            }
        })
    }
})

const profile = extendType({
    type: "Query",
    definition(t) {
        t.field('profile', {
            type: "User",
            args: {
                id: nonNull(intArg())
            },
            async resolve(parent, { id }) {
                return prisma.user.findUnique({ where: { id } })
            }
        })
    }
})

const searchUsers = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field('searchUsers', {
            type: "User",
            args: {
                value: nonNull(stringArg())
            },
            async resolve(_, { value }) {
                return prisma.user.findMany({
                    where: {
                        name: {
                            contains: value,
                            mode: "insensitive"
                        }
                    },
                })
            }
        })
    }
})


const similarMakers = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field('similarMakers', {
            type: "User",
            args: {
                id: nonNull(intArg())
            },
            async resolve(parent, { id }, ctx) {
                return prisma.user.findMany({
                    where: {
                        AND: {
                            id: {
                                not: id
                            }
                        }
                    },
                    take: 3,
                })
            }
        })
    }
})

const ProfileDetailsInput = inputObjectType({
    name: 'ProfileDetailsInput',
    definition(t) {
        t.string('name');
        t.field('avatar', {
            type: ImageInput
        })
        t.string('email')
        t.string('jobTitle')
        t.string('lightning_address')
        t.string('website')
        t.string('twitter')
        t.string('discord')
        t.string('github')
        t.string('linkedin')
        t.string('bio')
        t.string('location')
    }
})

const updateProfileDetails = extendType({
    type: 'Mutation',
    definition(t) {
        t.field('updateProfileDetails', {
            type: 'MyProfile',
            args: { data: ProfileDetailsInput },
            async resolve(_root, args, ctx) {
                const user = await getUserById(ctx.user?.id);

                // Do some validation
                if (!user?.id)
                    throw new Error("You have to login");
                // TODO: validate new data

                // ----------------
                // Check if the user uploaded a new image, and if so, 
                // remove the old one from the hosting service, then replace it with this one
                // ----------------
                let avatarId = user.avatar_id;
                if (args.data.avatar.id) {
                    const newAvatarProviderId = args.data.avatar.id;
                    const newAvatar = await prisma.hostedImage.findFirst({
                        where: {
                            provider_image_id: newAvatarProviderId
                        }
                    })

                    if (newAvatar && newAvatar.id !== user.avatar_id) {
                        avatarId = newAvatar.id;

                        await prisma.hostedImage.update({
                            where: {
                                id: newAvatar.id
                            },
                            data: {
                                is_used: true
                            }
                        });

                        await deleteImage(user.avatar_id)
                    }
                }

                // Preprocess & insert
                return prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: removeNulls({
                        ...args.data,
                        avatar_id: avatarId,

                        //hack to remove avatar from args.data
                        // can be removed later with a schema data validator
                        avatar: '',
                    })
                })
            }
        })
    },
})


const WalletKey = objectType({
    name: 'WalletKey',
    definition(t) {
        t.nonNull.string('key');
        t.nonNull.string('name');
        t.nonNull.date('createdAt');
        t.nonNull.boolean('is_current')
    }
})



const UserKeyInputType = inputObjectType({
    name: 'UserKeyInputType',
    definition(t) {
        t.nonNull.string('key');
        t.nonNull.string('name');
    }
})



const updateUserPreferences = extendType({
    type: 'Mutation',
    definition(t) {
        t.nonNull.field('updateUserPreferences', {
            type: 'MyProfile',
            args: { userKeys: list(nonNull(UserKeyInputType)) },
            async resolve(_root, args, ctx) {

                const user = ctx.user;
                if (!user?.id)
                    throw new Error("You have to login");


                //Update the userkeys
                //--------------------

                // Check if all the sent keys belong to the user
                const userKeys = (await prisma.userKey.findMany({
                    where: {
                        AND: {
                            user_id: {
                                equals: user.id,
                            },
                            key: {
                                in: args.userKeys.map(i => i.key)
                            }
                        },
                    },
                    select: {
                        key: true
                    }
                })).map(i => i.key);

                const newKeys = [];
                for (let i = 0; i < args.userKeys.length; i++) {
                    const item = args.userKeys[i];
                    if (userKeys.includes(item.key))
                        newKeys.push(item);
                }


                if (newKeys.length === 0)
                    throw new Error("You can't delete all your wallets keys")

                await prisma.userKey.deleteMany({
                    where: {
                        user_id: user.id
                    }
                })

                await prisma.userKey.createMany({
                    data: newKeys.map(i => ({
                        user_id: user.id,
                        key: i.key,
                        name: i.name,
                    }))
                })

                return prisma.user.findUnique({ where: { id: user.id } });
            }
        })
    }
})



const MakerRoleInput = inputObjectType({
    name: "MakerRoleInput",
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.field('level', { type: RoleLevelEnum })
    }
})

const MakerSkillInput = inputObjectType({
    name: "MakerSkillInput",
    definition(t) {
        t.nonNull.int('id');
    }
})


const ProfileRolesInput = inputObjectType({
    name: 'ProfileRolesInput',
    definition(t) {
        t.nonNull.list.nonNull.field('roles', {
            type: MakerRoleInput,
        })
        t.nonNull.list.nonNull.field('skills', {
            type: MakerSkillInput,
        })
    }
})

const updateProfileRoles = extendType({
    type: 'Mutation',
    definition(t) {
        t.field('updateProfileRoles', {
            type: 'MyProfile',
            args: { data: ProfileRolesInput },
            async resolve(_root, args, ctx) {
                const user = ctx.user;

                // Do some validation
                if (!user?.id)
                    throw new Error("You have to login");

                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        skills: {
                            set: [],
                        },
                        roles: {
                            deleteMany: {}
                        },
                    },
                }
                )


                return prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        skills: {
                            connect: args.data.skills,
                        },
                        roles: {
                            create: args.data.roles.map(r => ({ roleId: r.id, level: r.level }))
                        }
                    }
                })
            }
        })
    },
})





module.exports = {
    // Types

    BaseUser,
    User,
    MyProfile,
    WalletKey,
    MakerRole,
    // Queries
    me,
    profile,
    searchUsers,
    similarMakers,
    getAllMakersRoles,
    getAllMakersSkills,
    // Mutations
    updateProfileDetails,
    updateUserPreferences,
    updateProfileRoles,
}
